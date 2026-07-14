import { IsString, MinLength } from 'class-validator';

export class InscrireEtudiantDto {
  @IsString()
  @MinLength(1)
  numeroEtudiant: string;
}
