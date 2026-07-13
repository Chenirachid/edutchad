import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BulletinsService } from './bulletins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Bulletins')
@ApiBearerAuth('access-token')
@Controller('bulletins')
@UseGuards(JwtAuthGuard)
export class BulletinsController {
  constructor(private readonly bulletinsService: BulletinsService) {}

  @Get('etudiant/:id')
  getBulletinEtudiant(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bulletinsService.getBulletinEtudiant(id, user);
  }

  @Get('classe/:id')
  getBulletinClasse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bulletinsService.getBulletinClasse(id, user);
  }
}
