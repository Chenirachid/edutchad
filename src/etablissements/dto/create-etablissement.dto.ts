import { IsString, MinLength } from 'class-validator';

export class CreateEtablissementDto {
  @IsString()
  @MinLength(1)
  nom: string;
}
