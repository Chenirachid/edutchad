import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Limite de taille des requêtes relevée à 10 Mo : nécessaire pour les pièces jointes
  // du cahier de texte, envoyées encodées en base64 (donc ~33% plus lourdes que le fichier réel)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CSP réactivée avec des règles adaptées à notre propre frontend (police Google Fonts, styles/scripts inline first-party)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          baseUri: ["'self'"],
        },
      },
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS restreint : seules ces origines peuvent appeler l'API depuis un navigateur
  app.enableCors({
    origin: [
      'https://edutchad.onrender.com',
      'http://localhost:3001',
    ],
    credentials: true,
  });

  // Sert le frontend (public/index.html, public/educheni-logo.svg) à la racine du site
  // dotfiles: 'allow' est nécessaire pour que /.well-known/security.txt soit servi
  app.useStaticAssets(join(process.cwd(), 'public'), { dotfiles: 'allow' });

  const config = new DocumentBuilder()
    .setTitle('EduCheni API')
    .setDescription(
      "API de la plateforme universitaire EduCheni (type Pronote) — gestion des classes, matières, notes, absences, emploi du temps et bulletins.",
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
