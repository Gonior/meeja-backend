import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Token } from '../token.entity';

import { RedisService } from '@app/redis';
import { TTL } from '@app/common';
import { UserTokensRepositoryImpl } from 'src/auth/infrastructure/token.repository.impl';
import { TokenJwtService } from './token-jwt.service';

@Injectable()
export class TokenService {
  private logger = new Logger(TokenService.name);
  private ACCESS_KEY = (sessionId: string) => `session:${sessionId}:access`;
  private REFRESH_KEY = (sessionId: string) => `session:${sessionId}:refresh`;

  constructor(
    private readonly repo: UserTokensRepositoryImpl,
    private readonly redis: RedisService,
    private readonly jwt: TokenJwtService,
  ) {}

  async save(token: Token, accessTokenJti: string): Promise<void> {
    try {
      await this.redis.set(this.ACCESS_KEY(token.props.sessionId), accessTokenJti, {
        EX: TTL.SCD_ACCESS_TOKEN,
      });
      await this.redis.set(this.REFRESH_KEY(token.props.sessionId), token.props.jti, {
        EX: TTL.SCD_REFRESH_TOKEN,
      });

      await this.repo.saveToken(token);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error during save token');
    }
  }

  async refresh(token: string) {
    // verify token
    const { sub, jti, email, sessionId, exp } = await this.jwt.verify(token);

    // verify to redis fallback to database
    let record: Token | string | null = null;
    record = await this.redis.get(this.REFRESH_KEY(sessionId));
    if (!record) {
      record = await this.repo.findOneJtiActiveToken(jti);
    }
    if (!record) throw new UnauthorizedException('Token invalid for session');

    // revoke old token
    if (typeof record === 'string') {
      record = Token.create({
        userId: sub,
        jti,
        sessionId,
        token,
        expiresAt: new Date(exp * 1000),
      });
    }
    record.revoke();
    await this.revokeSession(record);
    // return new token
    const newToken = await this.jwt.createToken(sub, email);
    return { ...newToken, userId: sub };
  }

  async logout(tokenString: string): Promise<boolean> {
    let isRevoked = false;
    try {
      const { sub, jti, sessionId, exp } = await this.jwt.verify(tokenString);
      const token = Token.create({
        userId: sub,
        jti,
        sessionId,
        token: tokenString,
        expiresAt: new Date(exp * 1000),
      });
      token.revoke();
      isRevoked = (await this.revokeSession(token)) ?? false;
      return isRevoked;
    } catch {
      return false;
    }
  }

  async revokeSession(token: Token) {
    await this.redis.del(this.ACCESS_KEY(token.props.sessionId));
    await this.redis.del(this.REFRESH_KEY(token.props.sessionId));
    return await this.repo.revokeToken(token).catch((error) => this.logger.error(error.message));
  }
}
