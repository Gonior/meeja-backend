import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { v4 as uuid } from 'uuid';

import { TTL, IJwtPayload, EnvService } from '@app/common';

@Injectable()
export class TokenJwtService {
  private readonly logger = new Logger(TokenJwtService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  async signAccessToken(payload: IJwtPayload) {
    return await this.jwt.signAsync(payload, {
      secret: this.env.secretConfig.jwtAccessSecret,
      expiresIn: TTL.STR_ACCESS_TOKEN,
    });
  }

  async signRefreshToken(payload: IJwtPayload) {
    return await this.jwt.signAsync(payload, {
      secret: this.env.secretConfig.jwtRefreshSecret,
      expiresIn: TTL.STR_REFRESH_TOKEN,
    });
  }

  async verify(token: string) {
    try {
      return await this.jwt.verifyAsync<IJwtPayload>(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      this.logger.error(`Verify token error: (${message})`);
      throw new UnauthorizedException(`Invalid credetential (${message})`);
    }
  }

  async createToken(userId: number, email: string) {
    const refreshTokenJti = uuid();
    const accessTokenJti = uuid();
    const sessionId = randomBytes(10).toString('hex');

    const accessToken = await this.signAccessToken({
      sub: userId,
      email,
      sessionId,
      jti: accessTokenJti,
    });

    const refreshToken = await this.signRefreshToken({
      sub: userId,
      email,
      sessionId,
      jti: refreshTokenJti,
    });

    return {
      sessionId,
      accessToken,
      refreshToken,
      refreshTokenJti,
      accessTokenJti,
    };
  }
}
