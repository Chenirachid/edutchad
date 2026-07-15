import { IsString, Matches, MinLength } from 'class-validator';

export class CreateEtablissementDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le code ne peut contenir que des lettres minuscules, chiffres et tirets',
  })
  code: string;
}
