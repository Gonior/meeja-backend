import { ConfigService } from '@nestjs/config';
import { type IEnv } from '@app/common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvService {
  constructor(private config: ConfigService<IEnv>) {}

  get appConfig() {
    return {
      env: this.config.get<string>('NODE_ENV', { infer: true }),
      port: this.config.get<number>('PORT'),
      name: this.config.get<string>('APP_NAME', { infer: true }),
      host: this.config.get<string>('HOST', { infer: true }),
    };
  }

  get isProduction() {
    return this.appConfig.env === 'production';
  }

  get dbConfig() {
    return {
      url: this.config.get<string>('DB_URL', { infer: true }),
    };
  }

  get loggerConfig() {
    return {
      level: this.config.get<string>('LOG_LEVELS'),
    };
  }

  // get rabbitmqConfig() {
  //   return {
  //     url: this.config.get<string>('RABBITMQ_URL'),
  //   };
  // }

  get r2Config() {
    return {
      accountId: this.config.get<string>('R2_ACCOUNT_ID'),
      accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY'),
      bucketName: this.config.get<string>('R2_BUCKET_NAME'),
      tokenValue: this.config.get<string>('R2_TOKEN_VALUE'),
      endpoint: this.config.get<string>('R2_ENDPOINT'),
      publicUrl: this.config.get<string>('R2_PUBLIC_URL'),
    };
  }

  get redisConfig() {
    return {
      url: this.config.get<string>('REDIS_URL'),
    };
  }
  get secretConfig() {
    return {
      jwtAccessSecret: this.config.get<string>('JWT_ACCESS_SECRET', { infer: true }),
      jwtRefreshSecret: this.config.get<string>('JWT_REFRESH_SECRET', { infer: true }),
    };
  }
}
