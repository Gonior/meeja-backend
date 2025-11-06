// modules/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUser } from './dto/create-user.dto';
import { CreateUserCommand } from '../application/commands/create-user.command';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  async register(@Body() dto: CreateUser) {
    await this.commandBus.execute(new CreateUserCommand(dto));
    return { message: 'User registered successfully' };
  }
}
