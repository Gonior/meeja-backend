import { EnvService } from '@app/common';
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly env: EnvService) {}
  @Get()
  getHello() {
    return {
      ok: true,
      name: this.env.appConfig.name,
      env: this.env.appConfig.env,
    };
  }
}
