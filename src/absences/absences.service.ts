import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  classeId: true,
} as const;

@Injectable()
export class AbsencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAbsenceDto, currentUser: JwtPayload) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
    });

    if (!enseignement) {
      throw new NotFoundException(
        `Enseignement ${dto.enseignementId} introuvable`,
      );
    }

    if (
      currentUser.role === Role.PROFESSEUR &&
      enseignement.professeurId !== currentUser.sub
    ) {
      throw new ForbiddenException(
        "Vous ne pouvez déclarer une absence que dans vos propres matières/classes",
      );
    }

    return this.prisma.absence.create({
      data: {
        date: new Date(dto.date),
        justifiee: dto.justifiee ?? false,
        motif: dto.motif,
        etudiantId: dto.etudiantId,
        enseignementId: dto.enseignementId,
      },
    });
  }

  findAll(currentUser: JwtPayload) {
    if (currentUser.role === Role.ETUDIANT) {
      return this.prisma.absence.findMany({
        where: { etudiantId: currentUser.sub },
        include: { enseignement: { include: { matiere: true, classe: true } } },
      });
    }

    if (currentUser.role === Role.PROFESSEUR) {
      return this.prisma.absence.findMany({
        where: { enseignement: { professeurId: currentUser.sub } },
        include: {
          enseignement: { include: { matiere: true, classe: true } },
          etudiant: { select: etudiantSelect },
        },
      });
    }

    if (currentUser.role === Role.PARENT) {
      return this.prisma.absence.findMany({
        where: { etudiant: { parents: { some: { id: currentUser.sub } } } },
        include: {
          enseignement: { include: { matiere: true, classe: true } },
          etudiant: { select: etudiantSelect },
        },
      });
    }

    // ADMIN, VIE_SCOLAIRE, CHEF_PROJET : vue complète pour supervision
    return this.prisma.absence.findMany({
      include: {
        enseignement: { include: { matiere: true, classe: true } },
        etudiant: { select: etudiantSelect },
      },
    });
  }

  async findOne(id: number, currentUser: JwtPayload) {
    const absence = await this.prisma.absence.findUnique({
      where: { id },
      include: { enseignement: true },
    });

    if (!absence) {
      throw new NotFoundException(`Absence ${id} introuvable`);
    }

    await this.assertAccess(absence, currentUser);
    return absence;
  }

  async update(id: number, dto: UpdateAbsenceDto, currentUser: JwtPayload) {
    const absence = await this.findOne(id, currentUser);
    this.assertWriteAccess(absence, currentUser);

    // Seule la vie scolaire (ou l'administration) peut justifier/invalider une absence,
    // comme dans Pronote : le professeur déclare, la vie scolaire statue.
    if (
      dto.justifiee !== undefined &&
      currentUser.role === Role.PROFESSEUR
    ) {
      throw new ForbiddenException(
        "Seule la vie scolaire ou l'administration peut justifier une absence",
      );
    }

    return this.prisma.absence.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const absence = await this.findOne(id, currentUser);
    this.assertWriteAccess(absence, currentUser);
    return this.prisma.absence.delete({ where: { id } });
  }

  private async assertAccess(
    absence: { etudiantId: number; enseignement: { professeurId: number } },
    currentUser: JwtPayload,
  ) {
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.VIE_SCOLAIRE) return;
    if (
      currentUser.role === Role.ETUDIANT &&
      absence.etudiantId === currentUser.sub
    )
      return;
    if (
      currentUser.role === Role.PROFESSEUR &&
      absence.enseignement.professeurId === currentUser.sub
    )
      return;
    if (currentUser.role === Role.PARENT) {
      const lien = await this.prisma.user.findFirst({
        where: {
          id: absence.etudiantId,
          parents: { some: { id: currentUser.sub } },
        },
      });
      if (lien) return;
    }

    throw new ForbiddenException("Vous n'avez pas accès à cette absence");
  }

  private assertWriteAccess(
    absence: { enseignement: { professeurId: number } },
    currentUser: JwtPayload,
  ) {
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.VIE_SCOLAIRE) return;
    if (
      currentUser.role === Role.PROFESSEUR &&
      absence.enseignement.professeurId === currentUser.sub
    )
      return;

    throw new ForbiddenException(
      'Seul le professeur concerné, la vie scolaire ou un admin peut modifier cette absence',
    );
  }
}
