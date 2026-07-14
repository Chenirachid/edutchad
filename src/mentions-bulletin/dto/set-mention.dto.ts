import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Mention } from '@prisma/client';

export class SetMentionDto {
  @IsString()
  @MinLength(1)
  numeroEtudiant: string;

  @IsString()
  anneeScolaire: string;

  @IsEnum(Mention)
  mention: Mention;

  @IsOptional()
  @IsString()
  appreciation?: string;
}
