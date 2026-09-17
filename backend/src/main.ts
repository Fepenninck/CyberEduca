import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://cybereduca.vercel.app',
    ],
  });

  await app.listen(process.env.PORT || 3002);
  console.log(`API rodando na porta ${process.env.PORT || 3002}`);
}

bootstrap();