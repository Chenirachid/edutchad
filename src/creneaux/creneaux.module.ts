import { Module } from '@nestjs/common';
import { CreneauxController } from './creneaux.controller';
import { CreneauxService } from './creneaux.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CreneauxController],
  providers: [CreneauxService],
})
export class CreneauxModule {}
