import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const a = 'hallo';
  await app.listen(process.env.PORT ?? 3000).catch((e) => console.error(e));
}
bootstrap();
