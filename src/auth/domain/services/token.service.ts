import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Token } from '../token.entity';

import { RedisService } from '@app/redis';
import { TTL } from '@app/common';
import { UserTokensRepositoryImpl } from 'src/auth/infrastructure/token.repository.impl';

@Injectable()
export class TokenService {
  private logger = new Logger(TokenService.name);
  private ACCESS_KEY = (sessionId: string) => `session:${sessionId}:access`;
  private REFRESH_KEY = (sessionId: string) => `session:${sessionId}:refresh`;

  constructor(
    private readonly repo: UserTokensRepositoryImpl,
    private readonly redis: RedisService,
  ) {}

  async save(token: Token, accessTokenJti: string): Promise<void> {
    try {
      await this.redis.set(this.ACCESS_KEY(token.props.sessionId), accessTokenJti, {
        EX: TTL.SCD_ACCESS_TOKEN,
      });
      await this.redis.set(this.REFRESH_KEY(token.props.sessionId), token.props.jti, {
        EX: TTL.SCD_REFRESH_TOKEN,
      });

      console.log('saved');
      await this.repo.saveToken(token);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error during save token');
    }
  }
}
