import { Module } from '@nestjs/common';
import { BulletinMatiereController } from './bulletin-matiere.controller';
import { BulletinMatiereService } from './bulletin-matiere.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BulletinMatiereController],
  providers: [BulletinMatiereService],
  exports: [BulletinMatiereService],
})
export class BulletinMatiereModule {}
