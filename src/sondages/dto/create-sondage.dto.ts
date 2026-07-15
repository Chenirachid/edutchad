import { ArrayMinSize, IsArray, IsString, MinLength } from 'class-validator';

export class CreateSondageDto {
  @IsString()
  @MinLength(1)
  question: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Il faut au moins 2 options' })
  @IsString({ each: true })
  options: string[];
}
