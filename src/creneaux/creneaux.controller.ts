import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CreneauxService } from './creneaux.service';
import { CreateCreneauDto } from './dto/create-creneau.dto';
import { UpdateCreneauDto } from './dto/update-creneau.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Emploi du temps')
@ApiBearerAuth('access-token')
@Controller('creneaux')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreneauxController {
  constructor(private readonly creneauxService: CreneauxService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCreneauDto) {
    return this.creneauxService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.creneauxService.findAll(user);
  }

  // Consultation en lecture seule de l'emploi du temps d'une classe ou d'un professeur
  // précis — utile pour qu'un professeur puisse voir l'emploi du temps d'un collègue
  // ou d'une classe qui n'est pas la sienne, sans pouvoir le modifier.
  @Get('classe/:classeId')
  @Roles(Role.PROFESSEUR, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.VIE_SCOLAIRE)
  findParClasse(@Param('classeId', ParseIntPipe) classeId: number) {
    return this.creneauxService.findParClasse(classeId);
  }

  @Get('professeur/:professeurId')
  @Roles(Role.PROFESSEUR, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.VIE_SCOLAIRE)
  findParProfesseur(@Param('professeurId', ParseIntPipe) professeurId: number) {
    return this.creneauxService.findParProfesseur(professeurId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.creneauxService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCreneauDto) {
    return this.creneauxService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.creneauxService.remove(id);
  }
}
