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
import { ReunionsService } from './reunions.service';
import { CreateReunionDto } from './dto/create-reunion.dto';
import { RepondreInvitationDto } from './dto/repondre-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Réunions')
@ApiBearerAuth('access-token')
@Controller('reunions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReunionsController {
  constructor(private readonly reunionsService: ReunionsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateReunionDto, @CurrentUser() user: JwtPayload) {
    return this.reunionsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.reunionsService.findAll(user);
  }

  @Patch(':id/reponse')
  repondre(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RepondreInvitationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reunionsService.repondre(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.reunionsService.remove(id, user);
  }
}
