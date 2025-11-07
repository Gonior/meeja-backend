// modules/auth/auth.controller.ts
import { Body, Controller, Headers, Ip, Post, Req, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiHeader } from '@nestjs/swagger';
import { type Request } from 'express';

import { CreateUser } from './dto/create-user.dto';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { LoginDto } from './dto/login.dto';
import { LoginCommand } from '../application/commands/login.command';
import { ApiResponse, COOKIE_KEY, TokenResponse, TTL } from '@app/common';
import { RefreshTokenCommand } from '../application/commands/refresh-token.command';
import { LogoutCommand } from '../application/commands/logout.command';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  async register(@Body() dto: CreateUser) {
    await this.commandBus.execute(new CreateUserCommand(dto));
    return { message: 'User registered successfully' };
  }

  @ApiHeader({
    name: 'user-agent',
    description: 'User agent client',
    required: false,
  })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const { refreshToken, accessToken } = await this.commandBus.execute<
      LoginCommand,
      TokenResponse
    >(new LoginCommand({ ...dto, ipAddress, userAgent }));

    return {
      message: 'Login success',
      data: { accessToken },
      setCookies: [
        {
          name: COOKIE_KEY.REFRESH_TOKEN_KEY,
          value: refreshToken,
          options: { maxAge: TTL.MSSCD_REFRESH_TOKEN },
        },
      ],
    };
  }

  @ApiHeader({
    name: 'user-agent',
    description: 'User agent client',
    required: false,
  })
  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Ip() ipAddress?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const token = req.cookies['refreshToken'];

    if (!token) throw new UnauthorizedException('Refresh token is missing');

    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      TokenResponse
    >(new RefreshTokenCommand({ token, ipAddress, userAgent }));

    return {
      data: {
        accessToken,
      },
      setCookies: [
        {
          name: COOKIE_KEY.REFRESH_TOKEN_KEY,
          value: refreshToken,
          options: { maxAge: TTL.MSSCD_REFRESH_TOKEN },
        },
      ],
    };
  }

  @Post('logout')
  async logout(@Req() req: Request): Promise<ApiResponse<null | { isRevoked: boolean }>> {
    const token = req.cookies[COOKIE_KEY.REFRESH_TOKEN_KEY];
    if (!token)
      return {
        message: 'Token is missing, nothing to revoke',
        clearCookies: [COOKIE_KEY.REFRESH_TOKEN_KEY],
        data: null,
      };

    const isRevoked = await this.commandBus.execute<LogoutCommand, boolean>(
      new LogoutCommand({ token }),
    );
    return {
      clearCookies: [COOKIE_KEY.REFRESH_TOKEN_KEY],
      data: {
        isRevoked,
      },
    };
  }
}
