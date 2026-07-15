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
import { PunitionsService } from './punitions.service';
import { CreatePunitionDto } from './dto/create-punition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Punitions')
@ApiBearerAuth('access-token')
@Controller('punitions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PunitionsController {
  constructor(private readonly punitionsService: PunitionsService) {}

  @Post()
  @Roles(Role.PROFESSEUR, Role.ADMIN, Role.VIE_SCOLAIRE)
  create(@Body() dto: CreatePunitionDto, @CurrentUser() user: JwtPayload) {
    return this.punitionsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.punitionsService.findAll(user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.punitionsService.remove(id, user);
  }
}
