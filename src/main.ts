import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- IMPROVED RAW BODY MIDDLEWARE ---
  // We verify the content-type header explicitly to avoid messing up other requests.
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only intercept if it's a JSON request and NOT a file upload
    const contentType = req.headers['content-type'];
    
    if (contentType && contentType.includes('application/json')) {
      let data = '';
      
      // Set encoding to utf8 explicitly
      req.setEncoding('utf8');
      
      req.on('data', (chunk) => {
        data += chunk;
      });
      
      req.on('end', () => {
        // Attach raw body to the request object
        (req as any).rawBody = data;
        
        // CRITICAL FIX: Manually parse JSON and set it back to req.body
        // This prevents the "stream encoding should not be set" error
        try {
          if (data) {
            req.body = JSON.parse(data);
          }
        } catch (e) {
          // If parsing fails, let the default parser handle it or fail naturally
        }
        
        next();
      });
    } else {
      // For non-JSON requests (like form-data or text), skip this logic
      next();
    }
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