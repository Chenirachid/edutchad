import { Module } from '@nestjs/common';
import { PunitionsController } from './punitions.controller';
import { PunitionsService } from './punitions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PunitionsController],
  providers: [PunitionsService],
})
export class PunitionsModule {}
