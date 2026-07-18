import { IsString, MinLength } from 'class-validator';

export class CreateRessourceProfDto {
  @IsString()
  @MinLength(1)
  titre: string;

  @IsString()
  nom: string;

  @IsString()
  type: string;

  @IsString()
  data: string;
}
