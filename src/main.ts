import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
      {
        rawBody: true,
      },
    );

  app.useStaticAssets(
    join(__dirname, '..', 'uploads'),
    {
      prefix: '/uploads/',
    },
  );

  app.set('trust proxy', true);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'https://africom-social.web.app',
      'http://localhost:3000',
      'capacitor://localhost',
      'http://localhost',
    ],
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(
    `🚀 Backend running on port ${port}`,
  );
}

bootstrap();