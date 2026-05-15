import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from the 'uploads' folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.set('trust proxy', true);
  app.setGlobalPrefix('api');

  app.enableCors({
    // REPLACE '*' with your actual Firebase URL
    origin: [
      'https://africom-social.web.app', 
      'http://localhost:3000' // Keep this for local testing
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`Backend running on port ${port}`);
}

bootstrap();