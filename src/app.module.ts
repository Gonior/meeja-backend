import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from './create-user.handler';
import { GetUserHandler } from './get-user.handler';
import { UserCreatedHandler } from './user-created.handler';

@Module({
  imports: [CqrsModule],
  controllers: [AppController],
  providers: [AppService, CreateUserHandler, GetUserHandler, UserCreatedHandler],
})
export class AppModule {}
