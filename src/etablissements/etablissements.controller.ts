import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EtablissementsService } from './etablissements.service';
import { CreateEtablissementDto } from './dto/create-etablissement.dto';
import { UpdateEtablissementDto } from './dto/update-etablissement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Établissements')
@Controller('etablissements')
export class EtablissementsController {
  constructor(private readonly etablissementsService: EtablissementsService) {}

  // Route publique (aucune authentification) : nom + coordonnées, pour afficher
  // une petite page d'accueil dédiée via un lien du type /e/<code>.
  @Get('public/:code')
  async findPublicByCode(@Param('code') code: string) {
    const etablissement = await this.etablissementsService.findByCode(code);
    if (!etablissement) {
      throw new NotFoundException('Établissement introuvable');
    }
    return {
      nom: etablissement.nom,
      code: etablissement.code,
      adresse: etablissement.parametres?.adresse ?? null,
      telephone: etablissement.parametres?.telephone ?? null,
      siteWeb: etablissement.parametres?.siteWeb ?? null,
      emailPublic: etablissement.parametres?.emailPublic ?? null,
      texteAccueil: etablissement.parametres?.texteAccueil ?? null,
      photoData: etablissement.parametres?.photoData ?? null,
      photoType: etablissement.parametres?.photoType ?? null,
      cachetData: etablissement.parametres?.cachetData ?? null,
      cachetType: etablissement.parametres?.cachetType ?? null,
    };
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHEF_PROJET)
  create(@Body() dto: CreateEtablissementDto) {
    return this.etablissementsService.create(dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHEF_PROJET)
  findAll() {
    return this.etablissementsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHEF_PROJET)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.etablissementsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHEF_PROJET)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEtablissementDto) {
    return this.etablissementsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CHEF_PROJET)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.etablissementsService.remove(id);
  }
}
