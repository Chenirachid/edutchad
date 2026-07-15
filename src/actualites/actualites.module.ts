import { Module } from '@nestjs/common';
import { ActualitesController } from './actualites.controller';
import { ActualitesService } from './actualites.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActualitesController],
  providers: [ActualitesService],
})
export class ActualitesModule {}
