import { Module } from '@nestjs/common';
import { DeclarationsAbsenceController } from './declarations-absence.controller';
import { DeclarationsAbsenceService } from './declarations-absence.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeclarationsAbsenceController],
  providers: [DeclarationsAbsenceService],
})
export class DeclarationsAbsenceModule {}
