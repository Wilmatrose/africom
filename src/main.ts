import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, 
  });

  // ==================================================
  // GLOBAL VALIDATION PIPE
  // ==================================================
  // Enables @Exclude(), automatic DTO transformation, and validation.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true, // ✅ CORRECTED PROPERTY NAME
    }),
  );

  // ==================================================
  // BODY PARSERS
  // ==================================================
  
  // 1. JSON Parser
  app.use(express.json({ limit: '50mb' }));

  // 2. URL Encoded Parser
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==================================================
  // STATIC ASSETS REMOVED
  // ==================================================
  // No app.useStaticAssets needed because images are served via Cloudinary URLs.

  // ==================================================
  // PROXY & PREFIX
  // ==================================================
  app.set('trust proxy', true); 
  app.setGlobalPrefix('api');

  // ==================================================
  // CORS CONFIGURATION
  // ==================================================
  app.enableCors({
    origin: [
      'https://africom-social.web.app',
      'http://localhost:3000',
      'capacitor://localhost',
      'http://localhost',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Cloudinary Integration: Active`);
}

bootstrap();