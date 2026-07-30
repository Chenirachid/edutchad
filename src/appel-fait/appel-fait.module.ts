import { Module } from '@nestjs/common';
import { AppelFaitController } from './appel-fait.controller';
import { AppelFaitService } from './appel-fait.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppelFaitController],
  providers: [AppelFaitService],
})
export class AppelFaitModule {}
