import { Module } from '@nestjs/common';
import { MentionsBulletinController } from './mentions-bulletin.controller';
import { MentionsBulletinService } from './mentions-bulletin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MentionsBulletinController],
  providers: [MentionsBulletinService],
  exports: [MentionsBulletinService],
})
export class MentionsBulletinModule {}
