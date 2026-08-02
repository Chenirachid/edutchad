import { Type } from 'class-transformer';
import { IsArray, IsString, MinLength, ValidateNested } from 'class-validator';

export class LigneImportEleveDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsString()
  @MinLength(1)
  prenom: string;

  @IsString()
  @MinLength(1)
  classeNom: string;
}

export class ImportElevesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneImportEleveDto)
  lignes: LigneImportEleveDto[];
}
