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
import { MatieresService } from './matieres.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { InscrireEtudiantDto } from './dto/inscrire-etudiant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Matieres')
@ApiBearerAuth('access-token')
@Controller('matieres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatieresController {
  constructor(private readonly matieresService: MatieresService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMatiereDto, @CurrentUser() user: JwtPayload) {
    return this.matieresService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.matieresService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matieresService.findOne(id);
  }

  @Get(':id/etudiants')
  getEtudiantsInscrits(@Param('id', ParseIntPipe) id: number) {
    return this.matieresService.getEtudiantsInscrits(id);
  }

  @Post(':id/etudiants')
  @Roles(Role.ADMIN)
  inscrireEtudiant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InscrireEtudiantDto,
  ) {
    return this.matieresService.inscrireEtudiant(id, dto);
  }

  @Delete(':id/etudiants/:etudiantId')
  @Roles(Role.ADMIN)
  desinscrireEtudiant(
    @Param('id', ParseIntPipe) id: number,
    @Param('etudiantId', ParseIntPipe) etudiantId: number,
  ) {
    return this.matieresService.desinscrireEtudiant(id, etudiantId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatiereDto) {
    return this.matieresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matieresService.remove(id);
  }
}
