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
import { FraisScolariteService } from './frais-scolarite.service';
import { SetFraisDto } from './dto/set-frais.dto';
import { CreateVersementDto } from './dto/create-versement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Frais scolaires')
@ApiBearerAuth('access-token')
@Controller('frais-scolarite')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FraisScolariteController {
  constructor(private readonly fraisScolariteService: FraisScolariteService) {}

  @Post()
  @Roles(Role.ADMIN)
  setFrais(@Body() dto: SetFraisDto) {
    return this.fraisScolariteService.setFrais(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.fraisScolariteService.findAll();
  }

  // Un parent ne voit que le paiement de son propre enfant (lecture seule).
  @Get('mon-enfant/:etudiantId')
  @Roles(Role.PARENT)
  findPourParent(
    @Param('etudiantId', ParseIntPipe) etudiantId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fraisScolariteService.findPourParent(etudiantId, user.sub);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fraisScolariteService.findOne(id);
  }

  @Post(':id/versements')
  @Roles(Role.ADMIN)
  addVersement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVersementDto,
  ) {
    return this.fraisScolariteService.addVersement(id, dto);
  }
}
