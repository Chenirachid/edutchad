import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreneauDto } from './dto/create-creneau.dto';
import { UpdateCreneauDto } from './dto/update-creneau.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const includeContext = {
  enseignement: {
    include: {
      matiere: true,
      classe: true,
      professeur: { select: { id: true, nom: true, prenom: true } },
    },
  },
} as const;

@Injectable()
export class CreneauxService {
  constructor(private readonly prisma: PrismaService) {}

  private chevauchent(debutA: string, finA: string, debutB: string, finB: string) {
    return debutA < finB && debutB < finA;
  }

  private async verifierConflits(params: {
    jour: string;
    heureDebut: string;
    heureFin: string;
    salle?: string | null;
    professeurId: number;
    classeId: number;
    excludeCreneauId?: number;
  }) {
    const autresCreneaux = await this.prisma.creneau.findMany({
      where: {
        jour: params.jour as never,
        id: params.excludeCreneauId ? { not: params.excludeCreneauId } : undefined,
      },
      include: { enseignement: true },
    });

    for (const c of autresCreneaux) {
      if (!this.chevauchent(params.heureDebut, params.heureFin, c.heureDebut, c.heureFin)) {
        continue;
      }
      if (c.enseignement.professeurId === params.professeurId) {
        throw new ConflictException(
          `Conflit : ce professeur a déjà un cours ${c.heureDebut}-${c.heureFin} ce jour-là`,
        );
      }
      if (c.enseignement.classeId === params.classeId) {
        throw new ConflictException(
          `Conflit : cette classe a déjà un cours ${c.heureDebut}-${c.heureFin} ce jour-là`,
        );
      }
      if (params.salle && c.salle && c.salle === params.salle) {
        throw new ConflictException(
          `Conflit : la salle ${params.salle} est déjà occupée ${c.heureDebut}-${c.heureFin} ce jour-là`,
        );
      }
    }
  }

  async create(dto: CreateCreneauDto) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
    });

    if (!enseignement) {
      throw new NotFoundException(
        `Enseignement ${dto.enseignementId} introuvable`,
      );
    }

    await this.verifierConflits({
      jour: dto.jour,
      heureDebut: dto.heureDebut,
      heureFin: dto.heureFin,
      salle: dto.salle,
      professeurId: enseignement.professeurId,
      classeId: enseignement.classeId,
    });

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
    const existant = await this.findOne(id);

    if (dto.jour || dto.heureDebut || dto.heureFin || dto.salle !== undefined) {
      await this.verifierConflits({
        jour: dto.jour ?? existant.jour,
        heureDebut: dto.heureDebut ?? existant.heureDebut,
        heureFin: dto.heureFin ?? existant.heureFin,
        salle: dto.salle !== undefined ? dto.salle : existant.salle,
        professeurId: existant.enseignement.professeurId,
        classeId: existant.enseignement.classeId,
        excludeCreneauId: id,
      });
    }

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
