import { IsInt } from 'class-validator';

export class CreateEnseignementDto {
  @IsInt()
  classeId: number;

  @IsInt()
  matiereId: number;

  @IsInt()
  professeurId: number;
}
