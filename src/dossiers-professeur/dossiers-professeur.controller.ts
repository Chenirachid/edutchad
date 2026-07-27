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
import { DossiersProfesseurService } from './dossiers-professeur.service';
import { CreateDossierProfesseurDto } from './dto/create-dossier-professeur.dto';
import { AddDocumentProfesseurDto } from './dto/add-document-professeur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Dossiers professeur')
@ApiBearerAuth('access-token')
@Controller('dossiers-professeur')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PROFESSEUR)
export class DossiersProfesseurController {
  constructor(private readonly service: DossiersProfesseurService) {}

  @Post(':professeurId')
  upsert(
    @Param('professeurId', ParseIntPipe) professeurId: number,
    @Body() dto: CreateDossierProfesseurDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.upsert(professeurId, dto, user);
  }

  @Get(':professeurId')
  findOne(
    @Param('professeurId', ParseIntPipe) professeurId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(professeurId, user);
  }

  @Post(':professeurId/documents')
  ajouterDocument(
    @Param('professeurId', ParseIntPipe) professeurId: number,
    @Body() dto: AddDocumentProfesseurDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.ajouterDocument(professeurId, dto, user);
  }

  @Delete('documents/:documentId')
  supprimerDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.supprimerDocument(documentId, user);
  }

  // Validation réservée à l'administration : le prof ne peut jamais s'auto-valider.
  @Patch('documents/:documentId/valider')
  @Roles(Role.ADMIN)
  validerDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body('statut') statut: 'VALIDE' | 'REFUSE',
  ) {
    return this.service.validerDocument(documentId, statut);
  }
}
