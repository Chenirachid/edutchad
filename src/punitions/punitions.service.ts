import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePunitionDto } from './dto/create-punition.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
} as const;

const auteurSelect = {
  id: true,
  nom: true,
  prenom: true,
  role: true,
} as const;

@Injectable()
export class PunitionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePunitionDto, currentUser: JwtPayload) {
    const etudiant = await this.prisma.user.findUnique({
      where: { id: dto.etudiantId },
    });
    if (!etudiant) {
      throw new NotFoundException(`Étudiant ${dto.etudiantId} introuvable`);
    }

    return this.prisma.punition.create({
      data: {
        type: dto.type,
        motif: dto.motif,
        dureeHeures: dto.dureeHeures,
        etudiantId: dto.etudiantId,
        auteurId: currentUser.sub,
      },
      include: {
        etudiant: { select: etudiantSelect },
        auteur: { select: auteurSelect },
      },
    });
  }

  findAll(currentUser: JwtPayload) {
    const include = {
      etudiant: { select: etudiantSelect },
      auteur: { select: auteurSelect },
    };

    if (currentUser.role === Role.ETUDIANT) {
      return this.prisma.punition.findMany({
        where: { etudiantId: currentUser.sub },
        include,
        orderBy: { date: 'desc' },
      });
    }

    if (currentUser.role === Role.PROFESSEUR) {
      return this.prisma.punition.findMany({
        where: { auteurId: currentUser.sub },
        include,
        orderBy: { date: 'desc' },
      });
    }

    if (currentUser.role === Role.PARENT) {
      return this.prisma.punition.findMany({
        where: { etudiant: { parents: { some: { id: currentUser.sub } } } },
        include,
        orderBy: { date: 'desc' },
      });
    }

    // ADMIN
    return this.prisma.punition.findMany({ include, orderBy: { date: 'desc' } });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const punition = await this.prisma.punition.findUnique({ where: { id } });
    if (!punition) {
      throw new NotFoundException(`Punition ${id} introuvable`);
    }
    if (currentUser.role !== Role.ADMIN && punition.auteurId !== currentUser.sub) {
      throw new ForbiddenException("Seul l'auteur ou un admin peut supprimer cette punition");
    }
    return this.prisma.punition.delete({ where: { id } });
  }
}
