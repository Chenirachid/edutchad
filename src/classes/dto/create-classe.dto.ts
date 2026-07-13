import { IsString, MinLength } from 'class-validator';

export class CreateClasseDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  anneeScolaire: string;
}
