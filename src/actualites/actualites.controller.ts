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
import { ActualitesService } from './actualites.service';
import { CreateActualiteDto } from './dto/create-actualite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Actualités')
@ApiBearerAuth('access-token')
@Controller('actualites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActualitesController {
  constructor(private readonly actualitesService: ActualitesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_PROJET)
  create(@Body() dto: CreateActualiteDto, @CurrentUser() user: JwtPayload) {
    return this.actualitesService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.actualitesService.findAll(user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.CHEF_PROJET)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.actualitesService.remove(id, user);
  }
}
