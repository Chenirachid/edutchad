import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CSP désactivée : sert notre propre frontend (police Google Fonts, styles/scripts inline)
  app.use(helmet({ contentSecurityPolicy: false }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();

  // Sert le frontend (public/index.html, public/cheni-logo.svg) à la racine du site
  app.useStaticAssets(join(process.cwd(), 'public'));

  const config = new DocumentBuilder()
    .setTitle('Cheni API')
    .setDescription(
      "API de la plateforme universitaire Cheni (type Pronote) — gestion des classes, matières, notes, absences, emploi du temps et bulletins.",
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: "Colle ici le token reçu via /auth/login ou /auth/register (sans le mot 'Bearer')",
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
