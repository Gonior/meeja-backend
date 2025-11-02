import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsModule } from '@nestjs/cqrs';
import { DrizzleModule } from '@app/drizzle';

@Module({
  imports: [CqrsModule, DrizzleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
