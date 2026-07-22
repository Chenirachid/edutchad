import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateEtablissementDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nom?: string;
}
