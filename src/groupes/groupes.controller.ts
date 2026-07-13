import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupesService } from './groupes.service';
import { CreateMessageGroupeDto } from './dto/create-message-groupe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Groupes')
@ApiBearerAuth('access-token')
@Controller('groupes')
@UseGuards(JwtAuthGuard)
export class GroupesController {
  constructor(private readonly groupesService: GroupesService) {}

  @Get()
  getMesGroupes(@CurrentUser() user: JwtPayload) {
    return this.groupesService.getMesGroupes(user);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupesService.getMessages(id, user);
  }

  @Post(':id/messages')
  postMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMessageGroupeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.groupesService.postMessage(id, dto, user);
  }
}
