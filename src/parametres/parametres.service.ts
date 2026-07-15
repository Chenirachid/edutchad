import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParametresDto } from './dto/update-parametres.dto';

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  async get(etablissementId: number | null) {
    const existing = await this.prisma.parametrePlateforme.findFirst({
      where: { etablissementId },
    });
    if (existing) return existing;

    return this.prisma.parametrePlateforme.create({
      data: { etablissementId },
    });
  }

  async update(dto: UpdateParametresDto, etablissementId: number | null) {
    const existing = await this.get(etablissementId);
    return this.prisma.parametrePlateforme.update({
      where: { id: existing.id },
      data: dto,
    });
  }
}
