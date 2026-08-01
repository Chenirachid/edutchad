import { IsDateString, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDeclarationAbsenceDto {
  @IsInt()
  etudiantId: number;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsString()
  @MinLength(1)
  raison: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  justificatifNom?: string;

  @IsOptional()
  @IsString()
  justificatifType?: string;

  @IsOptional()
  @IsString()
  justificatifData?: string;
}
