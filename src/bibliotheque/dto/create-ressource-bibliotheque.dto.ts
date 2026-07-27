import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRessourceBibliothequeDto {
  @IsString()
  @MinLength(1)
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  matiere?: string;

  @IsString()
  nom: string;

  @IsString()
  type: string;

  @IsString()
  data: string;

  @IsOptional()
  @IsBoolean()
  reserveProf?: boolean;
}
