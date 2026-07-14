import { Module } from '@nestjs/common';
import { BulletinsController } from './bulletins.controller';
import { BulletinsService } from './bulletins.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MentionsBulletinModule } from '../mentions-bulletin/mentions-bulletin.module';

@Module({
  imports: [PrismaModule, MentionsBulletinModule],
  controllers: [BulletinsController],
  providers: [BulletinsService],
})
export class BulletinsModule {}
