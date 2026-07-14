import { IsEnum } from 'class-validator';
import { StatutInscriptionAdmin } from '@prisma/client';

export class UpdateStatutInscriptionDto {
  @IsEnum(StatutInscriptionAdmin)
  statut: StatutInscriptionAdmin;
}
