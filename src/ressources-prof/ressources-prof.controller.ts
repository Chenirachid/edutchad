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
import { RessourcesProfService } from './ressources-prof.service';
import { CreateRessourceProfDto } from './dto/create-ressource-prof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Ressources professeur')
@ApiBearerAuth('access-token')
@Controller('ressources-prof')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROFESSEUR)
export class RessourcesProfController {
  constructor(private readonly service: RessourcesProfService) {}

  @Post()
  create(@Body() dto: CreateRessourceProfDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get()
  findMine(@CurrentUser() user: JwtPayload) {
    return this.service.findMine(user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user);
  }
}
