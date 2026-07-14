import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CahiersTexteService } from './cahiers-texte.service';
import { CreateCahierTexteDto } from './dto/create-cahier-texte.dto';
import { UpdateCahierTexteDto } from './dto/update-cahier-texte.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Cahier de texte')
@ApiBearerAuth('access-token')
@Controller('cahiers-texte')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CahiersTexteController {
  constructor(private readonly cahiersTexteService: CahiersTexteService) {}

  @Post()
  @Roles(Role.PROFESSEUR)
  create(@Body() dto: CreateCahierTexteDto, @CurrentUser() user: JwtPayload) {
    return this.cahiersTexteService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.cahiersTexteService.findAll(user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCahierTexteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cahiersTexteService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.cahiersTexteService.remove(id, user);
  }
}
