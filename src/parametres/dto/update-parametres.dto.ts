import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  cachetData?: string;

  @IsOptional()
  @IsString()
  cachetType?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  siteWeb?: string;

  @IsOptional()
  @IsString()
  emailPublic?: string;

  @IsOptional()
  @IsString()
  texteAccueil?: string;

  @IsOptional()
  @IsString()
  enTeteOfficiel?: string;

  @IsOptional()
  @IsString()
  photoData?: string;

  @IsOptional()
  @IsString()
  photoType?: string;

  @IsOptional()
  @IsString()
  debutTrimestre2?: string;

  @IsOptional()
  @IsString()
  debutTrimestre3?: string;

  @IsOptional()
  @IsIn(['TRIMESTRE', 'SEMESTRE'])
  systemePeriode?: string;

  @IsOptional()
  emploiVisibleEleves?: boolean;

  @IsOptional()
  bulletinVisibleEleves?: boolean;
}
