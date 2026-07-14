import { Module } from '@nestjs/common';
import { CahiersTexteController } from './cahiers-texte.controller';
import { CahiersTexteService } from './cahiers-texte.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CahiersTexteController],
  providers: [CahiersTexteService],
})
export class CahiersTexteModule {}
