import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVersementDto {
  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsOptional()
  @IsString()
  moyen?: string;
}
