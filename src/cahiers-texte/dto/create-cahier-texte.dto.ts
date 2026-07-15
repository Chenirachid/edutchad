import { IsDateString, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCahierTexteDto {
  @IsDateString()
  date: string;

  @IsString()
  @MinLength(1)
  contenu: string;

  @IsOptional()
  @IsString()
  devoirs?: string;

  @IsInt()
  enseignementId: number;

  @IsOptional()
  @IsString()
  pieceJointeNom?: string;

  @IsOptional()
  @IsString()
  pieceJointeType?: string;

  @IsOptional()
  @IsString()
  pieceJointeData?: string;
}
