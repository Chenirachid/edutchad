import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ParametresService } from './parametres.service';
import { UpdateParametresDto } from './dto/update-parametres.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Paramètres')
@ApiBearerAuth('access-token')
@Controller('parametres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParametresController {
  constructor(private readonly parametresService: ParametresService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.parametresService.get(user.etablissementId);
  }

  @Patch()
  @Roles(Role.ADMIN)
  update(@Body() dto: UpdateParametresDto, @CurrentUser() user: JwtPayload) {
    return this.parametresService.update(dto, user.etablissementId);
  }
}
