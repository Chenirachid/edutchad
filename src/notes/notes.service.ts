import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNoteDto, currentUser: JwtPayload) {
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
        "Vous ne pouvez noter que dans vos propres matières/classes",
      );
    }

    return this.prisma.note.create({
      data: {
        valeur: dto.valeur,
        coefficient: dto.coefficient,
        type: dto.type,
        commentaire: dto.commentaire,
        etudiantId: dto.etudiantId,
        enseignementId: dto.enseignementId,
      },
    });
  }

  findAll(currentUser: JwtPayload) {
    if (currentUser.role === Role.ETUDIANT) {
      return this.prisma.note.findMany({
        where: { etudiantId: currentUser.sub },
        include: { enseignement: { include: { matiere: true, classe: true } } },
      });
    }

    if (currentUser.role === Role.PROFESSEUR) {
      return this.prisma.note.findMany({
        where: { enseignement: { professeurId: currentUser.sub } },
        include: {
          enseignement: { include: { matiere: true, classe: true } },
          etudiant: { select: etudiantSelect },
        },
      });
    }

    if (currentUser.role === Role.PARENT) {
      return this.prisma.note.findMany({
        where: { etudiant: { parents: { some: { id: currentUser.sub } } } },
        include: {
          enseignement: { include: { matiere: true, classe: true } },
          etudiant: { select: etudiantSelect },
        },
      });
    }

    // ADMIN
    return this.prisma.note.findMany({
      include: {
        enseignement: { include: { matiere: true, classe: true } },
        etudiant: { select: etudiantSelect },
      },
    });
  }

  async findOne(id: number, currentUser: JwtPayload) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: { enseignement: true },
    });

    if (!note) {
      throw new NotFoundException(`Note ${id} introuvable`);
    }

    await this.assertAccess(note, currentUser);
    return note;
  }

  async update(id: number, dto: UpdateNoteDto, currentUser: JwtPayload) {
    const note = await this.findOne(id, currentUser);
    this.assertWriteAccess(note, currentUser);
    return this.prisma.note.update({ where: { id }, data: dto });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const note = await this.findOne(id, currentUser);
    this.assertWriteAccess(note, currentUser);
    return this.prisma.note.delete({ where: { id } });
  }

  private async assertAccess(
    note: { etudiantId: number; enseignement: { professeurId: number } },
    currentUser: JwtPayload,
  ) {
    if (currentUser.role === Role.ADMIN) return;
    if (
      currentUser.role === Role.ETUDIANT &&
      note.etudiantId === currentUser.sub
    )
      return;
    if (
      currentUser.role === Role.PROFESSEUR &&
      note.enseignement.professeurId === currentUser.sub
    )
      return;
    if (currentUser.role === Role.PARENT) {
      const lien = await this.prisma.user.findFirst({
        where: { id: note.etudiantId, parents: { some: { id: currentUser.sub } } },
      });
      if (lien) return;
    }

    throw new ForbiddenException("Vous n'avez pas accès à cette note");
  }

  private assertWriteAccess(
    note: { enseignement: { professeurId: number } },
    currentUser: JwtPayload,
  ) {
    if (currentUser.role === Role.ADMIN) return;
    if (
      currentUser.role === Role.PROFESSEUR &&
      note.enseignement.professeurId === currentUser.sub
    )
      return;

    throw new ForbiddenException(
      'Seul le professeur concerné ou un admin peut modifier cette note',
    );
  }
}
