import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { CommonModule } from '@app/common';
import { DrizzleModule } from '@app/drizzle';
import { RedisModule } from '@app/redis';

@Module({
  imports: [CqrsModule, CommonModule, DrizzleModule, RedisModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
