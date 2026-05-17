import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  // ==================================================
  // CREATE APP
  // ==================================================
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      rawBody: true,
    },
  );

  // ==================================================
  // TRUST PROXY
  // ==================================================
  app.set('trust proxy', true);

  // ==================================================
  // GLOBAL API PREFIX
  // ==================================================
  app.setGlobalPrefix('api');

  // ==================================================
  // GLOBAL VALIDATION
  // ==================================================
  app.useGlobalPipes(
    new ValidationPipe({
      
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ==================================================
  // BODY PARSERS
  // ==================================================
  app.use(
    express.json({
      limit: '50mb',
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: '50mb',
    }),
  );

  // ==================================================
  // CORS
  // ==================================================
  app.enableCors({
  origin: [
    'https://africom-social.web.app',
    'https://africom_static.web.app',
    'https://africom-api.onrender.com',
    'http://localhost:3000',
    'http://localhost',
    'capacitor://localhost',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});

  // ==================================================
  // START SERVER
  // ==================================================
  const port = process.env.PORT || 3000;

  await app.listen(port);

  // ==================================================
  // LOGS
  // ==================================================
  console.log(`🚀 Backend running on port ${port}`);
  console.log(
    `📍 Environment: ${process.env.NODE_ENV || 'development'}`,
  );
  console.log('🌐 Cloudinary Integration: Active');
}

bootstrap();