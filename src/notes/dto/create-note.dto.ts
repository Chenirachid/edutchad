import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TypeEvaluation } from '@prisma/client';

export class CreateNoteDto {
  @IsNumber()
  @Min(0)
  @Max(20)
  valeur: number;

  @IsOptional()
  @IsNumber()
  coefficient?: number;

  @IsOptional()
  @IsEnum(TypeEvaluation)
  type?: TypeEvaluation;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsInt()
  etudiantId: number;

  @IsInt()
  enseignementId: number;
}
