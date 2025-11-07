import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtPayload, EnvService } from '@app/common';
import { RedisService } from '@app/redis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    env: EnvService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.secretConfig.jwtAccessSecret!,
    });
  }
  async validate(payload: IJwtPayload) {
    const isReady = this.redisService.getClient().isReady ?? false;
    if (isReady) {
      const exists = await this.redisService.get(`session:${payload.sessionId}:access`);
      if (!exists) throw new UnauthorizedException('Token revoked');
    }

    return payload;
  }
}
