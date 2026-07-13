import { IsEnum } from 'class-validator';
import { StatutInvitation } from '@prisma/client';

export class RepondreInvitationDto {
  @IsEnum(StatutInvitation)
  reponse: StatutInvitation;
}
