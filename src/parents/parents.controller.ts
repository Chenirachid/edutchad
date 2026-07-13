import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ParentsService } from './parents.service';
import { CreateLiaisonDto } from './dto/create-liaison.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Parents')
@ApiBearerAuth('access-token')
@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post('liaisons')
  @Roles(Role.ADMIN)
  createLiaison(@Body() dto: CreateLiaisonDto) {
    return this.parentsService.createLiaison(dto);
  }

  @Delete('liaisons')
  @Roles(Role.ADMIN)
  removeLiaison(@Body() dto: CreateLiaisonDto) {
    return this.parentsService.removeLiaison(dto);
  }

  @Get('mes-enfants')
  @Roles(Role.PARENT)
  getMesEnfants(@CurrentUser() user: JwtPayload) {
    return this.parentsService.getEnfants(user.sub);
  }
}
