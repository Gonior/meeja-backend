import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvService, ResponseInterceptor } from '@app/common';
import { Logger } from 'nestjs-pino';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(EnvService);
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();
  app.useGlobalInterceptors(new ResponseInterceptor(config));
  // app.useGlobalInterceptors(new LoggingInterceptor(logger));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((e) => console.error(e));
