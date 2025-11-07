// modules/auth/auth.controller.ts
import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUser } from './dto/create-user.dto';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { LoginDto } from './dto/login.dto';
import { LoginCommand } from '../application/commands/login.command';
import { ApiResponse, TokenResponse, TTL } from '@app/common';
import { ApiHeader } from '@nestjs/swagger';

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
    description: 'informasi user agent client',
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
        { name: 'refreshToken', value: refreshToken, options: { maxAge: TTL.MSSCD_REFRESH_TOKEN } },
      ],
    };
  }
}
