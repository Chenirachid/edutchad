import { IsInt } from 'class-validator';

export class InscrireEtudiantDto {
  @IsInt()
  etudiantId: number;
}
