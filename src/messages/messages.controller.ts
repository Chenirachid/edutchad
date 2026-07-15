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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Messagerie')
@ApiBearerAuth('access-token')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@Body() dto: CreateMessageDto, @CurrentUser() user: JwtPayload) {
    return this.messagesService.send(user, dto);
  }

  @Get('contacts')
  contacts(@CurrentUser() user: JwtPayload) {
    return this.messagesService.contacts(user);
  }

  @Get('recus')
  recus(@CurrentUser() user: JwtPayload) {
    return this.messagesService.recus(user.sub);
  }

  @Get('envoyes')
  envoyes(@CurrentUser() user: JwtPayload) {
    return this.messagesService.envoyes(user.sub);
  }

  @Get('non-lus/nombre')
  countNonLus(@CurrentUser() user: JwtPayload) {
    return this.messagesService.countNonLus(user.sub);
  }

  @Get('conversation/:userId')
  conversation(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.conversation(user.sub, userId);
  }

  @Patch(':id/lu')
  marquerLu(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.messagesService.marquerLu(id, user.sub);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.messagesService.remove(id, user.sub);
  }
}
