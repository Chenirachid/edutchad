import { Module } from '@nestjs/common';
import { FraisScolariteController } from './frais-scolarite.controller';
import { FraisScolariteService } from './frais-scolarite.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FraisScolariteController],
  providers: [FraisScolariteService],
})
export class FraisScolariteModule {}
