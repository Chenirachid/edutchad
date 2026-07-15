import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEpreuveDto } from './dto/create-epreuve.dto';
import { SaisirNotesEpreuveDto } from './dto/saisir-notes-epreuve.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const include = {
  enseignement: { include: { classe: true, matiere: true } },
} as const;

@Injectable()
export class EpreuvesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProprietaire(enseignementId: number, currentUser: JwtPayload) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: enseignementId },
    });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${enseignementId} introuvable`);
    }
    if (
      currentUser.role === Role.PROFESSEUR &&
      enseignement.professeurId !== currentUser.sub
    ) {
      throw new ForbiddenException("Cet enseignement ne vous appartient pas");
    }
    return enseignement;
  }

  async create(dto: CreateEpreuveDto, currentUser: JwtPayload) {
    await this.assertProprietaire(dto.enseignementId, currentUser);

    return this.prisma.epreuve.create({
      data: {
        titre: dto.titre,
        type: dto.type,
        date: new Date(dto.date),
        coefficient: dto.coefficient,
        enseignementId: dto.enseignementId,
      },
      include,
    });
  }

  findAll(currentUser: JwtPayload) {
    const where =
      currentUser.role === Role.PROFESSEUR
        ? { enseignement: { professeurId: currentUser.sub } }
        : {};

    return this.prisma.epreuve.findMany({
      where,
      include,
      orderBy: { date: 'desc' },
    });
  }

  async getFeuilleDeNotes(epreuveId: number, currentUser: JwtPayload) {
    const epreuve = await this.prisma.epreuve.findUnique({
      where: { id: epreuveId },
      include,
    });
    if (!epreuve) {
      throw new NotFoundException(`Épreuve ${epreuveId} introuvable`);
    }
    await this.assertProprietaire(epreuve.enseignementId, currentUser);

    const classe = await this.prisma.classe.findUnique({
      where: { id: epreuve.enseignement.classeId },
      include: {
        etudiants: {
          select: { id: true, nom: true, prenom: true, numeroEtudiant: true },
          orderBy: { nom: 'asc' },
        },
      },
    });

    const notes = await this.prisma.note.findMany({ where: { epreuveId } });
    const noteParEtudiant = new Map(notes.map((n) => [n.etudiantId, n]));

    return {
      epreuve,
      etudiants: (classe?.etudiants ?? []).map((et) => ({
        ...et,
        note: noteParEtudiant.get(et.id) ?? null,
      })),
    };
  }

  async saisirNotes(epreuveId: number, dto: SaisirNotesEpreuveDto, currentUser: JwtPayload) {
    const epreuve = await this.prisma.epreuve.findUnique({ where: { id: epreuveId } });
    if (!epreuve) {
      throw new NotFoundException(`Épreuve ${epreuveId} introuvable`);
    }
    await this.assertProprietaire(epreuve.enseignementId, currentUser);

    await Promise.all(
      dto.notes.map((n) =>
        this.prisma.note.upsert({
          where: { etudiantId_epreuveId: { etudiantId: n.etudiantId, epreuveId } },
          create: {
            valeur: n.valeur,
            commentaire: n.commentaire,
            type: epreuve.type,
            coefficient: epreuve.coefficient,
            etudiantId: n.etudiantId,
            enseignementId: epreuve.enseignementId,
            epreuveId,
          },
          update: {
            valeur: n.valeur,
            commentaire: n.commentaire,
          },
        }),
      ),
    );

    return this.getFeuilleDeNotes(epreuveId, currentUser);
  }

  async remove(epreuveId: number, currentUser: JwtPayload) {
    const epreuve = await this.prisma.epreuve.findUnique({ where: { id: epreuveId } });
    if (!epreuve) {
      throw new NotFoundException(`Épreuve ${epreuveId} introuvable`);
    }
    await this.assertProprietaire(epreuve.enseignementId, currentUser);
    await this.prisma.note.deleteMany({ where: { epreuveId } });
    return this.prisma.epreuve.delete({ where: { id: epreuveId } });
  }
}
