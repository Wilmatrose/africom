import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Needed for Stripe webhooks or other raw body parsing
  });

  // ==================================================
  // GLOBAL VALIDATION PIPE
  // ==================================================
  // This enables the @Exclude() decorator in your User Entity.
  // It ensures passwords are never sent to the frontend.
  // It also automatically transforms payloads to match your DTO classes.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties that don't have decorators
      transform: true, // Transforms payloads to be instances of DTO classes
      forbidNonWhitelisted: true, // Throws error if unknown properties are sent
    }),
  );

  // ==================================================
  // STATIC ASSETS REMOVED
  // ==================================================
  // We REMOVED app.useStaticAssets(join(__dirname, '..', 'uploads')).
  // Since you switched to Cloudinary, images are served via URL (e.g., res.cloudinary.com),
  // not from your local server. This keeps your server lighter and compatible with Render.

  // ==================================================
  // PROXY & PREFIX
  // ==================================================
  app.set('trust proxy', true); // Trust the Render proxy
  app.setGlobalPrefix('api'); // All routes will be prefixed with /api

  // ==================================================
  // CORS CONFIGURATION
  // ==================================================
  app.enableCors({
    origin: [
      'https://africom-social.web.app', // Your live Flutter Web URL
      'http://localhost:3000',           // Local Backend (if needed for testing)
      'capacitor://localhost',          // iOS/Android Capacitor
      'http://localhost',               // Android Localhost often maps here
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow cookies/auth headers
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();