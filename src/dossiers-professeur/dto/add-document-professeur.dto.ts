import { IsEnum, IsString, MinLength } from 'class-validator';
import { CategorieDocumentProf } from '@prisma/client';

export class AddDocumentProfesseurDto {
  @IsEnum(CategorieDocumentProf)
  categorie: CategorieDocumentProf;

  @IsString()
  @MinLength(1)
  nom: string;

  @IsString()
  type: string;

  @IsString()
  data: string;
}
