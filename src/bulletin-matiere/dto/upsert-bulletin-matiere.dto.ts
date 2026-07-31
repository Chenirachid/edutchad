import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertBulletinMatiereDto {
  @IsInt()
  etudiantId: number;

  @IsInt()
  enseignementId: number;

  @IsInt()
  @Min(1)
  @Max(3)
  trimestre: number;

  @IsOptional()
  @IsString()
  elementsProgramme?: string;

  @IsOptional()
  @IsString()
  appreciationTravail?: string;

  @IsOptional()
  @IsString()
  appreciationAvis?: string;
}
