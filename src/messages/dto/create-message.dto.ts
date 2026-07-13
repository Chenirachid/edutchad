import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  destinataireId: number;

  @IsString()
  @MinLength(1)
  contenu: string;
}
