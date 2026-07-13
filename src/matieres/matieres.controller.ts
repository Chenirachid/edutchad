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
import { MatieresService } from './matieres.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Matieres')
@ApiBearerAuth('access-token')
@Controller('matieres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatieresController {
  constructor(private readonly matieresService: MatieresService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateMatiereDto) {
    return this.matieresService.create(dto);
  }

  @Get()
  findAll() {
    return this.matieresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matieresService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatiereDto) {
    return this.matieresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matieresService.remove(id);
  }
}
