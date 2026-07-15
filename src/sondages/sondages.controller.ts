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
import { SondagesService } from './sondages.service';
import { CreateSondageDto } from './dto/create-sondage.dto';
import { VoterSondageDto } from './dto/voter-sondage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Sondages')
@ApiBearerAuth('access-token')
@Controller('sondages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SondagesController {
  constructor(private readonly sondagesService: SondagesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_PROJET)
  create(@Body() dto: CreateSondageDto, @CurrentUser() user: JwtPayload) {
    return this.sondagesService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.sondagesService.findAll(user);
  }

  @Post(':id/voter')
  voter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoterSondageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sondagesService.voter(id, dto, user);
  }

  @Patch(':id/cloturer')
  @Roles(Role.ADMIN, Role.CHEF_PROJET)
  cloturer(@Param('id', ParseIntPipe) id: number) {
    return this.sondagesService.cloturer(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.CHEF_PROJET)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.sondagesService.remove(id, user);
  }
}
