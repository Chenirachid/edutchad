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
import { BibliothequeService } from './bibliotheque.service';
import { CreateRessourceBibliothequeDto } from './dto/create-ressource-bibliotheque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Bibliothèque numérique')
@ApiBearerAuth('access-token')
@Controller('bibliotheque')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BibliothequeController {
  constructor(private readonly bibliothequeService: BibliothequeService) {}

  @Post()
  @Roles(Role.PROFESSEUR, Role.ADMIN, Role.CHEF_ETABLISSEMENT)
  create(@Body() dto: CreateRessourceBibliothequeDto, @CurrentUser() user: JwtPayload) {
    return this.bibliothequeService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.bibliothequeService.findAll(user);
  }

  @Get(':id/telecharger')
  findOneAvecContenu(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bibliothequeService.findOneAvecContenu(id, user);
  }

  @Delete(':id')
  @Roles(Role.PROFESSEUR, Role.ADMIN, Role.CHEF_ETABLISSEMENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.bibliothequeService.remove(id, user);
  }
}
