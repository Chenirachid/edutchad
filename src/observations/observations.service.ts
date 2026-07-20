import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  classeId: true,
} as const;

const auteurSelect = {
  id: true,
  nom: true,
  prenom: true,
  role: true,
} as const;

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateObservationDto, currentUser: JwtPayload) {
    const etudiant = await this.prisma.user.findUnique({
      where: { id: dto.etudiantId },
    });
    if (!etudiant) {
      throw new NotFoundException(`Étudiant ${dto.etudiantId} introuvable`);
    }

    return this.prisma.observation.create({
      data: {
        contenu: dto.contenu,
        type: dto.type,
        etudiantId: dto.etudiantId,
        enseignementId: dto.enseignementId,
        auteurId: currentUser.sub,
      },
      include: {
        etudiant: { select: etudiantSelect },
        auteur: { select: auteurSelect },
        enseignement: { include: { matiere: true, classe: true } },
      },
    });
  }

  findAll(currentUser: JwtPayload) {
    const include = {
      etudiant: { select: etudiantSelect },
      auteur: { select: auteurSelect },
      enseignement: { include: { matiere: true, classe: true } },
    };

    if (currentUser.role === Role.ETUDIANT) {
      return this.prisma.observation.findMany({
        where: { etudiantId: currentUser.sub },
        include,
        orderBy: { date: 'desc' },
      });
    }

    if (currentUser.role === Role.PROFESSEUR) {
      return this.prisma.observation.findMany({
        where: { auteurId: currentUser.sub },
        include,
        orderBy: { date: 'desc' },
      });
    }

    if (currentUser.role === Role.PARENT) {
      return this.prisma.observation.findMany({
        where: { etudiant: { parents: { some: { id: currentUser.sub } } } },
        include,
        orderBy: { date: 'desc' },
      });
    }

    // ADMIN, VIE_SCOLAIRE, CHEF_PROJET : vue complète pour supervision
    return this.prisma.observation.findMany({ include, orderBy: { date: 'desc' } });
  }

  async update(id: number, dto: UpdateObservationDto, currentUser: JwtPayload) {
    const observation = await this.prisma.observation.findUnique({ where: { id } });
    if (!observation) {
      throw new NotFoundException(`Observation ${id} introuvable`);
    }
    const peutTout = currentUser.role === Role.ADMIN || currentUser.role === Role.VIE_SCOLAIRE;
    if (!peutTout && observation.auteurId !== currentUser.sub) {
      throw new ForbiddenException("Seul l'auteur, la vie scolaire ou un admin peut modifier cette observation");
    }
    return this.prisma.observation.update({
      where: { id },
      data: dto,
      include: {
        etudiant: { select: etudiantSelect },
        auteur: { select: auteurSelect },
        enseignement: { include: { matiere: true, classe: true } },
      },
    });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const observation = await this.prisma.observation.findUnique({ where: { id } });
    if (!observation) {
      throw new NotFoundException(`Observation ${id} introuvable`);
    }
    const peutTout = currentUser.role === Role.ADMIN || currentUser.role === Role.VIE_SCOLAIRE;
    if (!peutTout && observation.auteurId !== currentUser.sub) {
      throw new ForbiddenException("Seul l'auteur, la vie scolaire ou un admin peut supprimer cette observation");
    }
    return this.prisma.observation.delete({ where: { id } });
  }
}
