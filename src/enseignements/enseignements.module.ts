import { Module } from '@nestjs/common';
import { EnseignementsController } from './enseignements.controller';
import { EnseignementsService } from './enseignements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EnseignementsController],
  providers: [EnseignementsService],
})
export class EnseignementsModule {}
