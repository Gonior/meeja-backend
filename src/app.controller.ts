import { EnvService } from '@app/common';
import { DrizzleService } from '@app/drizzle';
import { RedisService } from '@app/redis';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    private readonly env: EnvService,
    private readonly orm: DrizzleService,
    private readonly redis: RedisService,
  ) {}
  @Get()
  getHello() {
    return {
      ok: true,
      name: this.env.appConfig.name,
      env: this.env.appConfig.env,
    };
  }

  @Get('health/db')
  async getHealthDb() {
    return await this.orm.checkHealth();
  }

  @Get('health/redis')
  async getHealthRedis() {
    return await this.redis.checkHealth();
  }
}
