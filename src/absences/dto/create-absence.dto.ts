import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TypeAbsence } from '@prisma/client';

export class CreateAbsenceDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsEnum(TypeAbsence)
  type?: TypeAbsence;

  @IsOptional()
  @IsBoolean()
  justifiee?: boolean;

  @IsOptional()
  @IsString()
  motif?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  dureeMinutes?: number;

  @IsInt()
  etudiantId: number;

  @IsInt()
  enseignementId: number;
}
