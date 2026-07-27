import { Module } from '@nestjs/common';
import { BibliothequeController } from './bibliotheque.controller';
import { BibliothequeService } from './bibliotheque.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BibliothequeController],
  providers: [BibliothequeService],
})
export class BibliothequeModule {}
