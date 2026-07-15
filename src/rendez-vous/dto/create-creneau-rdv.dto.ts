import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateCreneauRdvDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  dureeMinutes?: number;
}
