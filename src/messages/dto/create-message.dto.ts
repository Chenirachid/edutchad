import { IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsInt()
  destinataireId?: number;

  @IsOptional()
  @IsEmail()
  destinataireEmail?: string;

  @IsString()
  @MinLength(1)
  contenu: string;
}
