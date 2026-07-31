import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { TypeEvaluation } from '@prisma/client';

export class CreateEpreuveDto {
  @IsString()
  @MinLength(1)
  titre: string;

  @IsOptional()
  @IsEnum(TypeEvaluation)
  type?: TypeEvaluation;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsNumber()
  coefficient?: number;

  @IsOptional()
  @IsDateString()
  datePublication?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  trimestre?: number;

  @IsInt()
  enseignementId: number;
}
