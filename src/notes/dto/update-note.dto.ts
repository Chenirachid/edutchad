import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends PartialType(
  OmitType(CreateNoteDto, ['etudiantId', 'enseignementId'] as const),
) {}
