import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParametresDto } from './dto/update-parametres.dto';

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  async get(etablissementId: number | null) {
    const existing = await this.prisma.parametrePlateforme.findFirst({
      where: { etablissementId },
      include: { etablissement: { select: { code: true } } },
    });
    if (existing) return existing;

    return this.prisma.parametrePlateforme.create({
      data: { etablissementId },
      include: { etablissement: { select: { code: true } } },
    });
  }

  async update(dto: UpdateParametresDto, etablissementId: number | null) {
    const existing = await this.get(etablissementId);
    return this.prisma.parametrePlateforme.update({
      where: { id: existing.id },
      data: dto,
      include: { etablissement: { select: { code: true } } },
    });
  }

  async supprimerCachet(etablissementId: number | null) {
    const existing = await this.get(etablissementId);
    return this.prisma.parametrePlateforme.update({
      where: { id: existing.id },
      data: { cachetData: null, cachetType: null },
      include: { etablissement: { select: { code: true } } },
    });
  }
}
