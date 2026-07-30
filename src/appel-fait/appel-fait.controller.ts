import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AppelFaitService } from './appel-fait.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Appel effectué')
@ApiBearerAuth('access-token')
@Controller('appel-fait')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROFESSEUR, Role.ADMIN)
export class AppelFaitController {
  constructor(private readonly service: AppelFaitService) {}

  @Post()
  marquerFait(
    @Body('enseignementId') enseignementId: number,
    @Body('date') date: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.marquerFait(Number(enseignementId), date, user);
  }

  @Get()
  listerPourProf(@CurrentUser() user: JwtPayload) {
    return this.service.listerPourProf(user);
  }
}
