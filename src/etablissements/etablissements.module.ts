import { Module } from '@nestjs/common';
import { EtablissementsController } from './etablissements.controller';
import { EtablissementsService } from './etablissements.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EtablissementsController],
  providers: [EtablissementsService],
})
export class EtablissementsModule {}
