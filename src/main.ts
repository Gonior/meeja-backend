import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import {
  AllExceptionFilter,
  AppValidationPipe,
  EnvService,
  ApiResponseInterceptor,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // biar bisa pake logger lain
  });

  app.use(cookieParser());

  const config = app.get(EnvService);
  const logger = app.get(Logger);

  // setup swagger ges
  const configSwagger = new DocumentBuilder()
    .setTitle('m3ja-backend')
    .setDescription('Dokumentasi otomatis m3ja-backend API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('docs', app, document);

  // pake pino logger
  app.useLogger(logger);

  // error response biar konsisten
  app.useGlobalFilters(new AllExceptionFilter());

  // success response biar konsisten
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  // error dari class-validator biar konsisten { field : [ errorMessage ] }
  app.useGlobalPipes(AppValidationPipe);

  // trigger onModuleDestroy()
  app.enableShutdownHooks();

  const port = config.appConfig.port || 3000;
  const host = config.appConfig.host || '127.0.0.1';

  await app.listen(port);
  logger.log(`📡 server running on port http://${host}:${port}`);
  logger.log(`📖 swagger running on port http://${host}:${port}/docs`);
}
bootstrap().catch((e) => console.error(e));
