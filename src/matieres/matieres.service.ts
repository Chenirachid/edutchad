import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { InscrireEtudiantDto } from './dto/inscrire-etudiant.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const professeurSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  numeroEtudiant: true,
  classeId: true,
} as const;

@Injectable()
export class MatieresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMatiereDto, currentUser: JwtPayload) {
    const etablissementId =
      currentUser.role === Role.CHEF_PROJET
        ? dto.etablissementId ?? null
        : currentUser.etablissementId;

    if (!etablissementId) {
      throw new BadRequestException(
        "Un établissement est requis pour créer une matière (etablissementId)",
      );
    }

    return this.prisma.matiere.create({
      data: { nom: dto.nom, coefficient: dto.coefficient, etablissementId },
    });
  }

  findAll(currentUser: JwtPayload) {
    const where: Prisma.MatiereWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    return this.prisma.matiere.findMany({ where });
  }

  async findOne(id: number) {
    const matiere = await this.prisma.matiere.findUnique({
      where: { id },
      include: {
        enseignements: { include: { classe: true, professeur: { select: professeurSelect } } },
      },
    });

    if (!matiere) {
      throw new NotFoundException(`Matière ${id} introuvable`);
    }

    return matiere;
  }

  async update(id: number, dto: UpdateMatiereDto) {
    await this.findOne(id);
    return this.prisma.matiere.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    try {
      return await this.prisma.matiere.delete({ where: { id } });
    } catch (err) {
      throw new BadRequestException(
        "Impossible de supprimer cette matière : des enseignements/notes y sont encore rattachés. Utilise la suppression forcée si tu es sûr.",
      );
    }
  }

  async removeForce(id: number) {
    await this.findOne(id);

    const enseignements = await this.prisma.enseignement.findMany({
      where: { matiereId: id },
      select: { id: true },
    });
    const enseignementIds = enseignements.map((e) => e.id);

    if (enseignementIds.length) {
      await this.prisma.note.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.absence.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.cahierTexte.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.epreuve.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.creneau.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.observation.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.enseignement.deleteMany({ where: { matiereId: id } });
    }

    await this.prisma.inscriptionMatiere.deleteMany({ where: { matiereId: id } });

    return this.prisma.matiere.delete({ where: { id } });
  }

  async getEtudiantsInscrits(matiereId: number) {
    await this.findOne(matiereId);
    const inscriptions = await this.prisma.inscriptionMatiere.findMany({
      where: { matiereId },
      include: { etudiant: { select: etudiantSelect } },
    });
    return inscriptions.map((i) => i.etudiant);
  }

  async inscrireEtudiant(matiereId: number, dto: InscrireEtudiantDto) {
    await this.findOne(matiereId);
    const etudiant = await this.prisma.user.findUnique({
      where: { numeroEtudiant: dto.numeroEtudiant },
    });
    if (!etudiant) {
      throw new NotFoundException(`Aucun étudiant avec le numéro ${dto.numeroEtudiant}`);
    }
    if (etudiant.role !== 'ETUDIANT') {
      throw new BadRequestException(`${dto.numeroEtudiant} n'a pas le rôle ETUDIANT`);
    }

    await this.prisma.inscriptionMatiere.upsert({
      where: { etudiantId_matiereId: { etudiantId: etudiant.id, matiereId } },
      create: { etudiantId: etudiant.id, matiereId },
      update: {},
    });

    return this.getEtudiantsInscrits(matiereId);
  }

  async desinscrireEtudiant(matiereId: number, etudiantId: number) {
    await this.findOne(matiereId);
    await this.prisma.inscriptionMatiere
      .delete({ where: { etudiantId_matiereId: { etudiantId, matiereId } } })
      .catch(() => {
        throw new NotFoundException("Cet étudiant n'est pas inscrit à cette matière");
      });
    return this.getEtudiantsInscrits(matiereId);
  }
}
