import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './presentation/auth.controller';
import { UserModule } from 'src/user/user.module';
import { CreateUserHandler } from './application/handlers/create-user.handler';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, CreateUserHandler],
})
export class AuthModule {}
