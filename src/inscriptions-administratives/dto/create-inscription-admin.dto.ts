import { IsString, MinLength } from 'class-validator';

export class CreateInscriptionAdminDto {
  @IsString()
  @MinLength(1)
  numeroEtudiant: string;

  @IsString()
  anneeScolaire: string;
}
