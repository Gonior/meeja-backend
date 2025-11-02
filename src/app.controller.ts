import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users')
  async getUsers() {
    return this.appService.getUsers();
  }

  @Post('users')
  async insertUser(
    @Body() user: { displayName: string; email: string; password: string; username: string },
  ) {
    return this.appService.create(user);
  }
}
