import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TypeObservation } from '@prisma/client';

export class UpdateObservationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  contenu?: string;

  @IsOptional()
  @IsEnum(TypeObservation)
  type?: TypeObservation;
}
