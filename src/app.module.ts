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
import { GroupesModule } from './groupes/groupes.module';
import { ReunionsModule } from './reunions/reunions.module';
import { CahiersTexteModule } from './cahiers-texte/cahiers-texte.module';
import { FraisScolariteModule } from './frais-scolarite/frais-scolarite.module';
import { InscriptionsAdministrativesModule } from './inscriptions-administratives/inscriptions-administratives.module';
import { MentionsBulletinModule } from './mentions-bulletin/mentions-bulletin.module';
import { DemandesSuppressionModule } from './demandes-suppression/demandes-suppression.module';
import { EtablissementsModule } from './etablissements/etablissements.module';
import { RendezVousModule } from './rendez-vous/rendez-vous.module';
import { EpreuvesModule } from './epreuves/epreuves.module';
import { ActualitesModule } from './actualites/actualites.module';
import { SondagesModule } from './sondages/sondages.module';

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
    MentionsBulletinModule,
    BulletinsModule,
    ParentsModule,
    UsersModule,
    MessagesModule,
    ParametresModule,
    ObservationsModule,
    PunitionsModule,
    GroupesModule,
    ReunionsModule,
    CahiersTexteModule,
    FraisScolariteModule,
    InscriptionsAdministrativesModule,
    DemandesSuppressionModule,
    EtablissementsModule,
    RendezVousModule,
    EpreuvesModule,
    ActualitesModule,
    SondagesModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}