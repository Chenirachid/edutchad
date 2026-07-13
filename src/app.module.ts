import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { MatieresModule } from './matieres/matieres.module';
import { NotesModule } from './notes/notes.module';
import { EnseignementsModule } from './enseignements/enseignements.module';
import { AbsencesModule } from './absences/absences.module';
import { CreneauxModule } from './creneaux/creneaux.module';
import { BulletinsModule } from './bulletins/bulletins.module';
import { ParentsModule } from './parents/parents.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { ParametresModule } from './parametres/parametres.module';
import { ObservationsModule } from './observations/observations.module';
import { PunitionsModule } from './punitions/punitions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute
        limit: 100, // 100 requêtes / minute / IP par défaut
      },
    ]),
    PrismaModule,
    AuthModule,
    StudentsModule,
    ClassesModule,
    MatieresModule,
    EnseignementsModule,
    NotesModule,
    AbsencesModule,
    CreneauxModule,
    BulletinsModule,
    ParentsModule,
    UsersModule,
    MessagesModule,
    ParametresModule,
    ObservationsModule,
    PunitionsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}