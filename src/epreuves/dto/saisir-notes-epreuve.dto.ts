import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class NoteEpreuveDto {
  @IsInt()
  etudiantId: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  valeur: number;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class SaisirNotesEpreuveDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NoteEpreuveDto)
  notes: NoteEpreuveDto[];
}
