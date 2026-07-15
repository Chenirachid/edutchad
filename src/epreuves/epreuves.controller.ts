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
import { EpreuvesService } from './epreuves.service';
import { CreateEpreuveDto } from './dto/create-epreuve.dto';
import { SaisirNotesEpreuveDto } from './dto/saisir-notes-epreuve.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Épreuves')
@ApiBearerAuth('access-token')
@Controller('epreuves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EpreuvesController {
  constructor(private readonly epreuvesService: EpreuvesService) {}

  @Post()
  @Roles(Role.PROFESSEUR, Role.ADMIN)
  create(@Body() dto: CreateEpreuveDto, @CurrentUser() user: JwtPayload) {
    return this.epreuvesService.create(dto, user);
  }

  @Get()
  @Roles(Role.PROFESSEUR, Role.ADMIN, Role.CHEF_PROJET)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.epreuvesService.findAll(user);
  }

  @Get(':id/feuille-de-notes')
  @Roles(Role.PROFESSEUR, Role.ADMIN)
  getFeuilleDeNotes(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epreuvesService.getFeuilleDeNotes(id, user);
  }

  @Post(':id/notes')
  @Roles(Role.PROFESSEUR, Role.ADMIN)
  saisirNotes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaisirNotesEpreuveDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epreuvesService.saisirNotes(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.PROFESSEUR, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.epreuvesService.remove(id, user);
  }
}
