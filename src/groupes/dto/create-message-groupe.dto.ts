import { IsString, MinLength } from 'class-validator';

export class CreateMessageGroupeDto {
  @IsString()
  @MinLength(1)
  contenu: string;
}
