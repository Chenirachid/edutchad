import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAbsenceDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  justifiee?: boolean;

  @IsOptional()
  @IsString()
  motif?: string;

  @IsInt()
  etudiantId: number;

  @IsInt()
  enseignementId: number;
}
