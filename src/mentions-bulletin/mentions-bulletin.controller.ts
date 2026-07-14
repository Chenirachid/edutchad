import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MentionsBulletinService } from './mentions-bulletin.service';
import { SetMentionDto } from './dto/set-mention.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Mentions bulletin')
@ApiBearerAuth('access-token')
@Controller('mentions-bulletin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MentionsBulletinController {
  constructor(private readonly service: MentionsBulletinService) {}

  @Post()
  set(@Body() dto: SetMentionDto) {
    return this.service.set(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
