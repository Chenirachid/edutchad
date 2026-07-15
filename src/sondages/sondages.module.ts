import { Module } from '@nestjs/common';
import { SondagesController } from './sondages.controller';
import { SondagesService } from './sondages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SondagesController],
  providers: [SondagesService],
})
export class SondagesModule {}
