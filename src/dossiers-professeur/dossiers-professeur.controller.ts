import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DossiersProfesseurService } from './dossiers-professeur.service';
import { CreateDossierProfesseurDto } from './dto/create-dossier-professeur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dossiers professeur')
@ApiBearerAuth('access-token')
@Controller('dossiers-professeur')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DossiersProfesseurController {
  constructor(private readonly service: DossiersProfesseurService) {}

  @Post(':professeurId')
  upsert(
    @Param('professeurId', ParseIntPipe) professeurId: number,
    @Body() dto: CreateDossierProfesseurDto,
  ) {
    return this.service.upsert(professeurId, dto);
  }

  @Get(':professeurId')
  findOne(@Param('professeurId', ParseIntPipe) professeurId: number) {
    return this.service.findOne(professeurId);
  }
}
