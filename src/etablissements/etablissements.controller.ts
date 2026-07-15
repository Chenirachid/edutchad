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
import { EtablissementsService } from './etablissements.service';
import { CreateEtablissementDto } from './dto/create-etablissement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Établissements')
@ApiBearerAuth('access-token')
@Controller('etablissements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CHEF_PROJET)
export class EtablissementsController {
  constructor(private readonly etablissementsService: EtablissementsService) {}

  @Post()
  create(@Body() dto: CreateEtablissementDto) {
    return this.etablissementsService.create(dto);
  }

  @Get()
  findAll() {
    return this.etablissementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.etablissementsService.findOne(id);
  }
}
