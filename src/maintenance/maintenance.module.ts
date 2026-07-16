import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}
