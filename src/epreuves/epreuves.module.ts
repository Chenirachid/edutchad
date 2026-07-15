import { Module } from '@nestjs/common';
import { EpreuvesController } from './epreuves.controller';
import { EpreuvesService } from './epreuves.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EpreuvesController],
  providers: [EpreuvesService],
})
export class EpreuvesModule {}
