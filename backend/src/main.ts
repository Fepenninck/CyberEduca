import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://cybereduca.vercel.app',
    ],
  });

  const port = process.env.PORT || 3002;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(port, '0.0.0.0');

  console.log(`API rodando na porta ${port}`);
}

bootstrap();