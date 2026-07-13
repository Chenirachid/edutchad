import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EnseignementsService } from './enseignements.service';
import { CreateEnseignementDto } from './dto/create-enseignement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Enseignements')
@ApiBearerAuth('access-token')
@Controller('enseignements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnseignementsController {
  constructor(private readonly enseignementsService: EnseignementsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateEnseignementDto) {
    return this.enseignementsService.create(dto);
  }

  @Get()
  findAll() {
    return this.enseignementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enseignementsService.findOne(id);
  }

  @Get(':id/etudiants')
  getEtudiants(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.enseignementsService.getEtudiants(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enseignementsService.remove(id);
  }
}
