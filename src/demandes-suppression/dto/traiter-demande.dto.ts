import { IsIn } from 'class-validator';

export class TraiterDemandeDto {
  @IsIn(['APPROUVEE', 'REJETEE'])
  decision: 'APPROUVEE' | 'REJETEE';
}
