import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class SetFraisDto {
  @IsString()
  @MinLength(1)
  numeroEtudiant: string;

  @IsNumber()
  @Min(0)
  montantTotal: number;

  @IsString()
  anneeScolaire: string;
}
