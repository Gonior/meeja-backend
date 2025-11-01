# Implementasi industry-grade auth di NestJS — JWT + Passport + Argon2 + Redis (konsep + praktik)

Mantap — aku tulis langkah lengkapnya: konsep, pola keamanan yang disarankan, dan kode contoh siap-paste untuk NestJS (TypeScript). Aku anggap kamu sudah punya User entity / model dasar. Kalau ada yang mau disesuaikan (cookie vs bearer header, single-device vs multi-session), bilang setelah ini.


---

### 1) Konsep arsitektur (ringkas & penting)

* **Password hashing**: gunakan argon2 (argon2id) dengan parameter yang sesuai. Simpan hash password — jangan simpan plaintext.

* **Access token (JWT)**: singkat umur (ex: 15m). Stateless, tanda-tangan dengan JWT_SECRET. Berisi sub (userId), roles, dan jti (unique id) — jti dipakai untuk blacklist opsional.

* **Refresh token**: lebih panjang umur (ex: 7–30 hari). Jangan simpan refresh token plaintext di DB; simpan hanya hash refresh token di Redis per-session. Redis memungkinkan revoke cepat & TTL.

* **Rotation & revocation:** Saat refresh, terapkan refresh token rotation: keluarkan refresh token baru dan hapus/invalidasi yang lama (di Redis). Jika ada reuse (compromise), revoke semua session.


* **Sessions**: setiap device/session punya entry Redis: {key: refreshTokenHash, value: {userId, jti, deviceInfo}} dengan TTL = refresh token lifetime.

* **Storing tokens**: untuk web:

  * Access token: biasanya pakai Authorization header Bearer.

  * Refresh token: simpan di HttpOnly, Secure, SameSite=Strict cookie (lebih aman daripada localStorage).


* **Logout**: hapus refresh token dari Redis. Pilihan: tambahkan jti access token ke blacklist sampai expire (opsional, but useful).

* **Rate limiting & brute force protection**: limit request login/register + lock account setelah banyak gagal.

* **2FA / Email verification*": optional, strongly recommended for production.

* **Rotate secrets**: ada prosedur kalau JWT_SECRET diganti: revoke refresh tokens / force re-login.



---

### 2) Dependensi yang perlu di-install

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local argon2 ioredis uuid
# untuk decorators / guards
pnpm add -d @types/passport-jwt @types/passport-local
```

---

### 3) Struktur file contoh


* `auth/auth.module.ts`

* `auth/auth.service.ts`

* `auth/auth.controller.ts`

* `auth/jwt.strategy.ts`

* `auth/refresh.strategy.ts` (opsional)

* `users/users.service.ts` (simple helpers)

* `redis/redis.service.ts` (wrapper ioredis)

* `entities/user.entity.ts` (contoh)

Aku berikan potongan penting lengkap.

---

### 4) Contoh implementasi — kode

> Catatan: sesuaikan dengan ORM-mu (TypeORM/Prisma). Aku pakai gaya service-method generic.



a) `redis/redis.service.ts` — wrapper ioredis
```Ts
// redis/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  
  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
```
b) `auth/auth.module.ts`
```Ts
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RedisService } from '../redis/redis.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET || 'change_me_access_secret',
        signOptions: { expiresIn: '15m' }, // default access token ttl
      }),
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, RedisService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

c) `auth/auth.service.ts`

```Ts
// auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private usersService: UsersService,
  ) {}

  // Register: hash password, create user
  async register(dto: {email: string; password: string; name?: string}) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new BadRequestException('Email already used');
    const hash = await argon2.hash(dto.password); // argon2id by default
    const user = await this.usersService.create({ ...dto, passwordHash: hash });
    return user;
  }

  // Validate credentials (for login)
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) return null;
    // hide sensitive fields
    const { passwordHash, ...rest } = user;
    return rest;
  }

  // Generate access + refresh tokens and store refresh hash in Redis
  async createTokens(userId: string, sessionInfo?: { device?: string }) {
    // jti unique per token
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessPayload = { sub: userId, jti: accessJti };
    const refreshPayload = { sub: userId, jti: refreshJti };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const rawRefreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret',
      expiresIn: '7d',
    });

    // store hash of refresh token in Redis, with TTL
    const refreshHash = await argon2.hash(rawRefreshToken);
    const redisKey = `refresh:${userId}:${refreshJti}`; // per-session key
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
    await this.redisService.set(redisKey, refreshHash, ttlSeconds);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      meta: { accessJti, refreshJti },
    };
  }

  // Refresh flow: verify refresh token, check Redis, rotate
  async refreshTokens(rawRefreshToken: string) {
    try {
      // verify signature & get payload
      const payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret',
      });
      const userId = payload.sub as string;
      const refreshJti = payload.jti as string;
      const redisKey = `refresh:${userId}:${refreshJti}`;
      const storedHash = await this.redisService.get(redisKey);
      if (!storedHash) {
        // reuse or tampered token — extra action recommended (revoke all sessions)
        throw new UnauthorizedException('Refresh token invalidated');
      }
      // check hash
      const ok = await argon2.verify(storedHash, rawRefreshToken);
      if (!ok) {
        await this.redisService.del(redisKey); // remove compromised entry
        throw new UnauthorizedException('Refresh token invalid');
      }

      // rotation: delete old refresh entry and create new tokens
      await this.redisService.del(redisKey);
      return this.createTokens(userId);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Logout: delete refresh entry
  async logout(userId: string, refreshJti: string) {
    await this.redisService.del(`refresh:${userId}:${refreshJti}`);
    // optionally add access jti to blacklist until expire (if you want immediate revoke)
  }
}
``` 

d) `auth/auth.controller.ts`

```Ts
// auth/auth.controller.ts
import { Controller, Post, Body, Req, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name?: string }) {
    const user = await this.authService.register(body);
    // generate tokens on registration (common pattern)
    const tokens = await this.authService.createTokens(user.id);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      tokens: {
        accessToken: tokens.accessToken,
      },
      // do NOT return refresh token in body if you set it as cookie below
      refreshToken: tokens.refreshToken,
    };
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return { statusCode: 401, message: 'Invalid credentials' };
    }
    const tokens = await this.authService.createTokens(user.id);
    // Set refresh token as httpOnly cookie (recommended)
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return {
      accessToken: tokens.accessToken,
      user,
    };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // read refresh token from cookie or body
    const rawRefresh = req.cookies?.refresh_token || (req.body && req.body.refreshToken);
    if (!rawRefresh) {
      return { statusCode: 401, message: 'No refresh token' };
    }
    const tokens = await this.authService.refreshTokens(rawRefresh);
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefresh = req.cookies?.refresh_token;
    if (rawRefresh) {
      try {
        const payload = await this.authService['jwtService'].verifyAsync(rawRefresh, {
          secret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh_secret',
        });
        await this.authService.logout(payload.sub, payload.jti);
      } catch (e) {
        // ignore
      }
      res.clearCookie('refresh_token');
    }
    return { ok: true };
  }
}
```
e) `auth/jwt.strategy.ts` — Passport JWT guard

```Ts
// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'change_me_access_secret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // payload.sub is userId; you can fetch user or return minimal info
    return { userId: payload.sub, jti: payload.jti };
  }
}
```
f) `users/users.service.ts` — pseudo user service

```Ts
// users/users.service.ts (very simplified)
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = new Map<string, any>();

  async findByEmail(email: string) {
    for (const u of this.users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }

  async create(data: { email: string; passwordHash: string; name?: string }) {
    const id = (Math.random()*1e9 | 0).toString();
    const user = { id, email: data.email, passwordHash: data.passwordHash, name: data.name || null };
    this.users.set(id, user);
    return user;
  }

  async findById(id: string) {
    return this.users.get(id) || null;
  }
}

```
---

### 5) Penjelasan detail flow refresh token rotation (cegah replay)

1. Client punya `refreshTokenA` (cookie).
2. Client request `/auth/refresh` dengan refreshTokenA.
3. Server verifikasi signature → ambil jtiA → cek Redis apakah ada entry `refresh:userId:jtiA`.
4. Kalau ada & hash cocok → hapus `refresh:userId:jtiA` (invalidasi token A) → buat `refreshTokenB` baru, simpan `refresh:userId:jtiB` (hash), return `refreshTokenB` ke client.
5. Jika attacker reuse `refreshTokenA` setelah sudah diganti, server melihat tidak ada entry di Redis → treat as possible attack → revoke semua session for that user (opsional) + force re-login.

---

### 6) Keamanan & konfigurasi penting

* **Secrets di env vars**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (panjang & acak). Jangan simpan di code.

* **Access token TTL**: 5–30 menit tergantung tradeoff UX/security.

* **Refresh TTL**: 7–30 hari. Shorter better.

* **Argon2 params**: gunakan default library; untuk production sesuaikan memory & time sesuai hardware. Dokumentasi Argon2: sesuaikan untuk make hashing take ~100ms on your hardware.

* **Cookies**: set `HttpOnly`, Secure (prod), and `SameSite=Strict/Lax` sesuai use-case.

* **CSRF**: kalau refresh token disimpan di cookie, lindungi endpoint `POST /auth/refresh` dengan CSRF token atau `require SameSite` + CORS trust domain. Menggunakan cookie + CSRF token double-submit lebih aman.

* **Rate limit**: apply rate limiting (e.g., nestjs-rate-limiter, express-rate-limit) on auth endpoints.

* **Account lockout**: blokir setelah 5–10 gagal login attempts per N minutes.

* **Audit logging**: simpan logs untuk `login/logout/refresh` attempts (IP, device).

* **Monitoring**: track abnormal refresh reuse, suspicious behavior.



---

### 7) Testing & hardening

* **Unit tests**: test login, refresh rotation, logout, invalid token cases.

* **Penetration test**: simulate token theft & reuse.

* **Load test**: ensure Redis TTL & throughput OK under load.

* **Secret rotation plan**: have a way to rotate secrets (revoke refresh tokens or maintain versioning claim ver in JWT).



---

### 8) Extra industry tips / extensions

* **Short-lived access + opaque access tokens**: you can use opaque access tokens and store more server-side if you need immediate revocation.

* **JWT kid / key rotation**: use JWKs & key ids if you need public key signing.

* **Session limits**: limit active sessions per user (e.g., max 5 devices).

* **Push notifications / device revoke**: store device metadata in Redis/DB to show user sessions UI.

* **MFA**: add TOTP or SMS/Push as second factor after login.



---

### 9) Checklist quick (to-do before production)

* [ ] ENV secrets set and not in repo

* [ ] HTTPS & Secure cookies

* [ ] Redis cluster with persistence/backups

* [ ] Argon2 tuned for infra

* [ ] Rate limiting + account lockouts

* [ ] CSRF protection if using cookies

* [ ] Logging & monitoring for token reuse

* [ ] Tests for rotation & reuse detection

