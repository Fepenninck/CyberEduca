import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://cybereduca.vercel.app',
    ],
  });

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0');

  console.log(`API rodando na porta ${port}`);
}

bootstrap();