import { IsBoolean, IsDateString, IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';
import { TypeJustificatifIdentite } from '@prisma/client';

export class CreateInscriptionAdminDto {
  @IsString()
  @MinLength(1)
  numeroEtudiant: string;

  @IsString()
  anneeScolaire: string;

  @IsDateString()
  dateNaissance: string;

  @IsEnum(TypeJustificatifIdentite)
  typeJustificatif: TypeJustificatifIdentite;

  @IsString()
  justificatifNom: string;

  @IsString()
  justificatifType: string;

  @IsString()
  justificatifData: string;

  @IsBoolean()
  vientDAutreEtablissement: boolean;

  @ValidateIf((o) => o.vientDAutreEtablissement === true)
  @IsString()
  @MinLength(1, { message: "Le justificatif de transfert est obligatoire si l'élève vient d'un autre établissement" })
  justificatifTransfertNom?: string;

  @ValidateIf((o) => o.vientDAutreEtablissement === true)
  @IsString()
  justificatifTransfertType?: string;

  @ValidateIf((o) => o.vientDAutreEtablissement === true)
  @IsString()
  justificatifTransfertData?: string;
}
