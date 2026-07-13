import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { TypePunition } from '@prisma/client';

export class CreatePunitionDto {
  @IsEnum(TypePunition)
  type: TypePunition;

  @IsString()
  @MinLength(1)
  motif: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  dureeHeures?: number;

  @IsInt()
  etudiantId: number;
}
