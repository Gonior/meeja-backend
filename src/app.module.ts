import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
