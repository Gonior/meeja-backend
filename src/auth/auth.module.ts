import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './presentation/auth.controller';
import { UserModule } from 'src/user/user.module';
import { CreateUserCommandHandler } from './application/handlers/create-user.command.handler';
import { LoginCommandHandler } from './application/handlers/login.command.handler';
import { TokenJwtService } from './domain/services/token-jwt.service';
import { TokenService } from './domain/services/token.service';
import { I_USER_TOKEN_REPOSITORY } from '@app/common';
import { UserTokensRepositoryImpl } from './infrastructure/token.repository.impl';
import { RedisModule } from '@app/redis';
import { DrizzleModule } from '@app/drizzle';
import { RefreshTokenCommandHandler } from './application/handlers/refresh-token.command.handler';
import { LogoutCommandHandler } from './application/handlers/logout.command.handler';

@Module({
  imports: [CqrsModule, UserModule, JwtModule, RedisModule, DrizzleModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    CreateUserCommandHandler,
    LoginCommandHandler,
    LogoutCommandHandler,
    RefreshTokenCommandHandler,
    TokenJwtService,
    TokenService,
    UserTokensRepositoryImpl,
    { provide: I_USER_TOKEN_REPOSITORY, useClass: UserTokensRepositoryImpl },
  ],
  exports: [I_USER_TOKEN_REPOSITORY],
})
export class AuthModule {}
