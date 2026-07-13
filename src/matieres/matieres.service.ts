import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { InscrireEtudiantDto } from './dto/inscrire-etudiant.dto';

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
  classeId: true,
} as const;

@Injectable()
export class MatieresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMatiereDto) {
    return this.prisma.matiere.create({ data: dto });
  }

  findAll() {
    return this.prisma.matiere.findMany();
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
    const etudiant = await this.prisma.user.findUnique({ where: { id: dto.etudiantId } });
    if (!etudiant) {
      throw new NotFoundException(`Étudiant ${dto.etudiantId} introuvable`);
    }
    if (etudiant.role !== 'ETUDIANT') {
      throw new BadRequestException(`L'utilisateur ${dto.etudiantId} n'a pas le rôle ETUDIANT`);
    }

    await this.prisma.inscriptionMatiere.upsert({
      where: { etudiantId_matiereId: { etudiantId: dto.etudiantId, matiereId } },
      create: { etudiantId: dto.etudiantId, matiereId },
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
