import { Module } from '@nestjs/common';
import { GroupesController } from './groupes.controller';
import { GroupesService } from './groupes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GroupesController],
  providers: [GroupesService],
})
export class GroupesModule {}
