import { IsString, MinLength } from 'class-validator';

export class CreateActualiteDto {
  @IsString()
  @MinLength(1)
  titre: string;

  @IsString()
  @MinLength(1)
  contenu: string;
}
