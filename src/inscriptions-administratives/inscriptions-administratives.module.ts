import { Module } from '@nestjs/common';
import { InscriptionsAdministrativesController } from './inscriptions-administratives.controller';
import { InscriptionsAdministrativesService } from './inscriptions-administratives.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InscriptionsAdministrativesController],
  providers: [InscriptionsAdministrativesService],
})
export class InscriptionsAdministrativesModule {}
