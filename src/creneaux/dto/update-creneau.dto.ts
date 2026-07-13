import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCreneauDto } from './create-creneau.dto';

export class UpdateCreneauDto extends PartialType(
  OmitType(CreateCreneauDto, ['enseignementId'] as const),
) {}
