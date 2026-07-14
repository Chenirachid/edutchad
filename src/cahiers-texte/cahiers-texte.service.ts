import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCahierTexteDto } from './dto/create-cahier-texte.dto';
import { UpdateCahierTexteDto } from './dto/update-cahier-texte.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const include = {
  enseignement: { include: { matiere: true, classe: true, professeur: { select: { id: true, nom: true, prenom: true } } } },
} as const;

@Injectable()
export class CahiersTexteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCahierTexteDto, currentUser: JwtPayload) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
    });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${dto.enseignementId} introuvable`);
    }
    if (enseignement.professeurId !== currentUser.sub) {
      throw new ForbiddenException(
        "Vous ne pouvez remplir le cahier de texte que pour vos propres enseignements",
      );
    }

    return this.prisma.cahierTexte.create({
      data: {
        date: new Date(dto.date),
        contenu: dto.contenu,
        devoirs: dto.devoirs,
        enseignementId: dto.enseignementId,
      },
      include,
    });
  }

  async findAll(currentUser: JwtPayload) {
    if (currentUser.role === Role.PROFESSEUR) {
      return this.prisma.cahierTexte.findMany({
        where: { enseignement: { professeurId: currentUser.sub } },
        include,
        orderBy: { date: 'desc' },
      });
    }

    if (currentUser.role === Role.ETUDIANT) {
      const etudiant = await this.prisma.user.findUnique({
        where: { id: currentUser.sub },
        select: { classeId: true },
      });
      if (!etudiant?.classeId) return [];

      return this.prisma.cahierTexte.findMany({
        where: { enseignement: { classeId: etudiant.classeId } },
        include,
        orderBy: { date: 'desc' },
      });
    }

    // ADMIN
    return this.prisma.cahierTexte.findMany({ include, orderBy: { date: 'desc' } });
  }

  private async assertProprietaire(id: number, currentUser: JwtPayload) {
    const entry = await this.prisma.cahierTexte.findUnique({
      where: { id },
      include: { enseignement: true },
    });
    if (!entry) {
      throw new NotFoundException(`Entrée ${id} introuvable`);
    }
    if (currentUser.role !== Role.ADMIN && entry.enseignement.professeurId !== currentUser.sub) {
      throw new ForbiddenException("Seul le professeur concerné ou un admin peut modifier cette entrée");
    }
    return entry;
  }

  async update(id: number, dto: UpdateCahierTexteDto, currentUser: JwtPayload) {
    await this.assertProprietaire(id, currentUser);
    return this.prisma.cahierTexte.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include,
    });
  }

  async remove(id: number, currentUser: JwtPayload) {
    await this.assertProprietaire(id, currentUser);
    return this.prisma.cahierTexte.delete({ where: { id } });
  }
}
