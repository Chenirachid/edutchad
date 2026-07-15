import { Module } from '@nestjs/common';
import { RendezVousController } from './rendez-vous.controller';
import { RendezVousService } from './rendez-vous.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RendezVousController],
  providers: [RendezVousService],
})
export class RendezVousModule {}
