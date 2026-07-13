import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreneauDto } from './dto/create-creneau.dto';
import { UpdateCreneauDto } from './dto/update-creneau.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const includeContext = {
  enseignement: { include: { matiere: true, classe: true } },
} as const;

@Injectable()
export class CreneauxService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCreneauDto) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
    });

    if (!enseignement) {
      throw new NotFoundException(
        `Enseignement ${dto.enseignementId} introuvable`,
      );
    }

    return this.prisma.creneau.create({
      data: dto,
      include: includeContext,
    });
  }

  async findAll(currentUser: JwtPayload) {
    if (currentUser.role === Role.ETUDIANT) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.sub },
        select: { classeId: true },
      });

      if (!user?.classeId) return [];

      return this.prisma.creneau.findMany({
        where: { enseignement: { classeId: user.classeId } },
        include: includeContext,
      });
    }

    if (currentUser.role === Role.PROFESSEUR) {
      return this.prisma.creneau.findMany({
        where: { enseignement: { professeurId: currentUser.sub } },
        include: includeContext,
      });
    }

    // ADMIN (et PARENT en attendant le lien parent-enfant)
    return this.prisma.creneau.findMany({ include: includeContext });
  }

  async findOne(id: number) {
    const creneau = await this.prisma.creneau.findUnique({
      where: { id },
      include: includeContext,
    });

    if (!creneau) {
      throw new NotFoundException(`Créneau ${id} introuvable`);
    }

    return creneau;
  }

  async update(id: number, dto: UpdateCreneauDto) {
    await this.findOne(id);
    return this.prisma.creneau.update({
      where: { id },
      data: dto,
      include: includeContext,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.creneau.delete({ where: { id } });
  }
}
