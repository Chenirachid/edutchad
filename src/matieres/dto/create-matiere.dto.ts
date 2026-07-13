import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMatiereDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsOptional()
  @IsNumber()
  coefficient?: number;
}
