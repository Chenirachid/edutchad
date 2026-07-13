import { IsInt } from 'class-validator';

export class CreateLiaisonDto {
  @IsInt()
  parentId: number;

  @IsInt()
  enfantId: number;
}
