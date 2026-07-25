import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateParametresDto {
  @IsOptional()
  @IsString()
  nomEtablissement?: string;

  @IsOptional()
  @IsString()
  anneeScolaire?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  bareme?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format attendu : HH:MM' })
  heureDebutPause?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Format attendu : HH:MM' })
  heureFinPause?: string;
}
