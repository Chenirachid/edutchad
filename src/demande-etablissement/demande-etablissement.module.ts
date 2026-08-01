import { Module } from '@nestjs/common';
import { DemandeEtablissementController } from './demande-etablissement.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [DemandeEtablissementController],
})
export class DemandeEtablissementModule {}
