import { Module } from '@nestjs/common';
import { RessourcesProfController } from './ressources-prof.controller';
import { RessourcesProfService } from './ressources-prof.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RessourcesProfController],
  providers: [RessourcesProfService],
})
export class RessourcesProfModule {}
