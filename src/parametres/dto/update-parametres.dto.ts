import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
}
