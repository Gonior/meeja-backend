import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  AllExceptionFilter,
  AppValidationPipe,
  EnvService,
  ResponseInterceptor,
} from '@app/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // biar bisa pake logger lain
  });

  const config = app.get(EnvService);
  const logger = app.get(Logger);

  // pake pino logger
  app.useLogger(logger);

  // error response biar konsisten
  app.useGlobalFilters(new AllExceptionFilter());

  // success response biar konsisten
  app.useGlobalInterceptors(new ResponseInterceptor(config));

  // error dari class-validator biar konsisten { field : [ errorMessage ] }
  app.useGlobalPipes(AppValidationPipe);

  // trigger onModuleDestroy()
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((e) => console.error(e));
