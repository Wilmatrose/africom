import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- CORRECTED RAW BODY MIDDLEWARE ---
  // We use Buffer to capture the raw data safely.
  app.use((req: Request, res: Response, next: NextFunction) => {
    let data = '';

    // NOTE: We do NOT use req.setEncoding here. 
    // We will treat the chunks as buffers.
    
    req.on('data', (chunk: any) => {
      // If chunk is a buffer, convert to string; otherwise keep as is
      data += chunk instanceof Buffer ? chunk.toString('utf8') : chunk;
    });
    
    req.on('end', () => {
      // 1. Attach raw body string to request (needed for Webhook Signature)
      (req as any).rawBody = data;

      // 2. Manually parse JSON to req.body (satisfies NestJS)
      try {
        // Only parse if there is data and content-type suggests JSON
        if (data && req.headers['content-type']?.includes('application/json')) {
          req.body = JSON.parse(data);
        }
      } catch (e) {
        // If parse fails, let NestJS handle the error or try default parsing
        // We leave req.body undefined here if it fails
      }

      next();
    });
  });
  // ------------------------------------------

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.set('trust proxy', true);
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'https://africom-social.web.app', 
      'http://localhost:3000',
      'capacitor://localhost',
      'http://localhost'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
}

bootstrap();