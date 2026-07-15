import { IsInt } from 'class-validator';

export class VoterSondageDto {
  @IsInt()
  optionId: number;
}
