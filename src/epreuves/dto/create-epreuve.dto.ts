import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
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

  @IsInt()
  enseignementId: number;
}
