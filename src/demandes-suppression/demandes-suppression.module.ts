import { Module } from '@nestjs/common';
import { DemandesSuppressionController } from './demandes-suppression.controller';
import { DemandesSuppressionService } from './demandes-suppression.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DemandesSuppressionController],
  providers: [DemandesSuppressionService],
})
export class DemandesSuppressionModule {}
