import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BulletinMatiereService } from './bulletin-matiere.service';
import { UpsertBulletinMatiereDto } from './dto/upsert-bulletin-matiere.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Bulletin — programme & appréciations par matière')
@ApiBearerAuth('access-token')
@Controller('bulletin-matiere')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROFESSEUR, Role.ADMIN, Role.CHEF_ETABLISSEMENT)
export class BulletinMatiereController {
  constructor(private readonly service: BulletinMatiereService) {}

  @Post()
  upsert(@Body() dto: UpsertBulletinMatiereDto, @CurrentUser() user: JwtPayload) {
    return this.service.upsert(dto, user);
  }

  @Get('enseignement/:enseignementId')
  findPourEnseignement(
    @Param('enseignementId', ParseIntPipe) enseignementId: number,
    @Query('trimestre') trimestre: string,
  ) {
    return this.service.findPourEnseignement(enseignementId, Number(trimestre) || 1);
  }
}
