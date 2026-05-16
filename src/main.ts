import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- CRITICAL MIDDLEWARE FOR PAYMENT SECURITY ---
  // NestJS parses JSON automatically, which destroys the original string formatting.
  // We need to capture the raw body string to verify KoraPay's signature hash.
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only apply to JSON content types to avoid messing with file uploads
    if (req.is('application/json')) {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        (req as any).rawBody = data; // Attach raw body to request object
        next();
      });
    } else {
      next();
    }
  });
  // -------------------------------------------------

  // Serve static files from the 'uploads' folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Trust proxy (Important if behind Render/Heroku/AWS load balancer)
  app.set('trust proxy', true);

  // Set Global Prefix (All routes will be /api/...)
  app.setGlobalPrefix('api');

  app.enableCors({
    // Allow your frontend origins
    origin: [
      'https://africom-social.web.app', 
      'http://localhost:3000',
      'capacitor://localhost', // For iOS/Android app
      'http://localhost' // For Web testing
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
}

bootstrap();