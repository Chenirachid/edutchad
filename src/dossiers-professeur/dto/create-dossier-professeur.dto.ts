import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateDossierProfesseurDto {
  @IsDateString()
  dateNaissance: string;

  @IsString()
  @MinLength(1)
  justification: string;

  @IsString()
  diplomeNom: string;

  @IsString()
  diplomeType: string;

  @IsString()
  diplomeData: string;
}
