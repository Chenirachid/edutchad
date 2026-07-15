import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DemandesSuppressionService } from './demandes-suppression.service';
import { TraiterDemandeDto } from './dto/traiter-demande.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Demandes de suppression admin')
@ApiBearerAuth('access-token')
@Controller('demandes-suppression-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CHEF_PROJET, Role.CHEF_ETABLISSEMENT)
export class DemandesSuppressionController {
  constructor(private readonly service: DemandesSuppressionService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Patch(':id')
  traiter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TraiterDemandeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.traiter(id, dto, user);
  }
}
