import { IsEnum, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { JourSemaine } from '@prisma/client';

const HEURE_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateCreneauDto {
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @IsString()
  @Matches(HEURE_REGEX, { message: 'Format attendu: HH:mm (ex: 08:30)' })
  heureDebut: string;

  @IsString()
  @Matches(HEURE_REGEX, { message: 'Format attendu: HH:mm (ex: 10:00)' })
  heureFin: string;

  @IsOptional()
  @IsString()
  salle?: string;

  @IsInt()
  enseignementId: number;
}
