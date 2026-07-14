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

@ApiTags('Frais scolaires')
@ApiBearerAuth('access-token')
@Controller('frais-scolarite')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FraisScolariteController {
  constructor(private readonly fraisScolariteService: FraisScolariteService) {}

  @Post()
  setFrais(@Body() dto: SetFraisDto) {
    return this.fraisScolariteService.setFrais(dto);
  }

  @Get()
  findAll() {
    return this.fraisScolariteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fraisScolariteService.findOne(id);
  }

  @Post(':id/versements')
  addVersement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVersementDto,
  ) {
    return this.fraisScolariteService.addVersement(id, dto);
  }
}
