import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAbsenceDto } from './create-absence.dto';

export class UpdateAbsenceDto extends PartialType(
  OmitType(CreateAbsenceDto, ['etudiantId', 'enseignementId'] as const),
) {}
