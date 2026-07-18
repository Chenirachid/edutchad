import { Module } from '@nestjs/common';
import { DossiersProfesseurController } from './dossiers-professeur.controller';
import { DossiersProfesseurService } from './dossiers-professeur.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DossiersProfesseurController],
  providers: [DossiersProfesseurService],
})
export class DossiersProfesseurModule {}
