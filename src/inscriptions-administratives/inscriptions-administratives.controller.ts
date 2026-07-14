import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { InscriptionsAdministrativesService } from './inscriptions-administratives.service';
import { CreateInscriptionAdminDto } from './dto/create-inscription-admin.dto';
import { UpdateStatutInscriptionDto } from './dto/update-statut-inscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Inscriptions administratives')
@ApiBearerAuth('access-token')
@Controller('inscriptions-administratives')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InscriptionsAdministrativesController {
  constructor(private readonly service: InscriptionsAdministrativesService) {}

  @Post()
  create(@Body() dto: CreateInscriptionAdminDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/statut')
  updateStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatutInscriptionDto,
  ) {
    return this.service.updateStatut(id, dto);
  }
}
