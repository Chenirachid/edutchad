import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCahierTexteDto } from './create-cahier-texte.dto';

export class UpdateCahierTexteDto extends PartialType(
  OmitType(CreateCahierTexteDto, ['enseignementId'] as const),
) {}
