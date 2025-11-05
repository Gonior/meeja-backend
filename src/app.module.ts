import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { CommonModule } from '@app/common';

@Module({
  imports: [CqrsModule, CommonModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
