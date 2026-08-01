import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeclarationsAbsenceService } from './declarations-absence.service';
import { CreateDeclarationAbsenceDto } from './dto/create-declaration-absence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Déclarations d\'absence (parents)')
@ApiBearerAuth('access-token')
@Controller('declarations-absence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeclarationsAbsenceController {
  constructor(private readonly service: DeclarationsAbsenceService) {}

  @Post()
  @Roles(Role.PARENT)
  create(@Body() dto: CreateDeclarationAbsenceDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Patch(':id/statut')
  @Roles(Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.VIE_SCOLAIRE)
  changerStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body('statut') statut: 'VALIDEE' | 'REFUSEE',
  ) {
    return this.service.changerStatut(id, statut);
  }
}
