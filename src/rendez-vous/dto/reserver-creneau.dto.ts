import { IsInt, IsOptional, IsString } from 'class-validator';

export class ReserverCreneauDto {
  @IsInt()
  etudiantId: number;

  @IsOptional()
  @IsString()
  motif?: string;
}
