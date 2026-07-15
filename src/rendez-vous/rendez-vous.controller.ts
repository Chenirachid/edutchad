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
import { RendezVousService } from './rendez-vous.service';
import { CreateCreneauRdvDto } from './dto/create-creneau-rdv.dto';
import { ReserverCreneauDto } from './dto/reserver-creneau.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Rendez-vous parents-profs')
@ApiBearerAuth('access-token')
@Controller('rendez-vous')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RendezVousController {
  constructor(private readonly rendezVousService: RendezVousService) {}

  @Post('creneaux')
  @Roles(Role.PROFESSEUR)
  creerCreneau(@Body() dto: CreateCreneauRdvDto, @CurrentUser() user: JwtPayload) {
    return this.rendezVousService.creerCreneau(dto, user);
  }

  @Get('mes-creneaux')
  @Roles(Role.PROFESSEUR)
  getMesCreneaux(@CurrentUser() user: JwtPayload) {
    return this.rendezVousService.getMesCreneaux(user);
  }

  @Get('disponibles')
  @Roles(Role.PARENT)
  getCreneauxDisponibles(@CurrentUser() user: JwtPayload) {
    return this.rendezVousService.getCreneauxDisponibles(user);
  }

  @Get('mes-reservations')
  @Roles(Role.PARENT)
  getMesReservations(@CurrentUser() user: JwtPayload) {
    return this.rendezVousService.getMesReservations(user);
  }

  @Post('creneaux/:id/reserver')
  @Roles(Role.PARENT)
  reserver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReserverCreneauDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rendezVousService.reserver(id, dto, user);
  }

  @Delete('creneaux/:id/reservation')
  annulerReservation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rendezVousService.annulerReservation(id, user);
  }

  @Delete('creneaux/:id')
  @Roles(Role.PROFESSEUR)
  supprimerCreneau(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rendezVousService.supprimerCreneau(id, user);
  }
}
