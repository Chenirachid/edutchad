import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateReunionDto {
  @IsString()
  @MinLength(1)
  sujet: string;

  @IsOptional()
  @IsString()
  lieu?: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  inviteIds: number[];
}
