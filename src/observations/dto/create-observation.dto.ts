import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { TypeObservation } from '@prisma/client';

export class CreateObservationDto {
  @IsString()
  @MinLength(1)
  contenu: string;

  @IsOptional()
  @IsEnum(TypeObservation)
  type?: TypeObservation;

  @IsInt()
  etudiantId: number;

  @IsOptional()
  @IsInt()
  enseignementId?: number;
}
