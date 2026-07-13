import { Module } from '@nestjs/common';
import { ReunionsController } from './reunions.controller';
import { ReunionsService } from './reunions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReunionsController],
  providers: [ReunionsService],
})
export class ReunionsModule {}
