import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetFraisDto } from './dto/set-frais.dto';
import { CreateVersementDto } from './dto/create-versement.dto';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  numeroEtudiant: true,
  classeId: true,
} as const;

function avecSolde(frais: { montantTotal: number; versements: { montant: number }[] }) {
  const totalVerse = frais.versements.reduce((acc, v) => acc + v.montant, 0);
  return {
    ...frais,
    totalVerse,
    soldeRestant: Math.round((frais.montantTotal - totalVerse) * 100) / 100,
  };
}

@Injectable()
export class FraisScolariteService {
  constructor(private readonly prisma: PrismaService) {}

  async setFrais(dto: SetFraisDto) {
    const etudiant = await this.prisma.user.findUnique({
      where: { numeroEtudiant: dto.numeroEtudiant },
    });
    if (!etudiant) {
      throw new NotFoundException(`Aucun étudiant avec le numéro ${dto.numeroEtudiant}`);
    }

    const frais = await this.prisma.fraisScolarite.upsert({
      where: { etudiantId: etudiant.id },
      create: {
        etudiantId: etudiant.id,
        montantTotal: dto.montantTotal,
        anneeScolaire: dto.anneeScolaire,
      },
      update: {
        montantTotal: dto.montantTotal,
        anneeScolaire: dto.anneeScolaire,
      },
      include: { etudiant: { select: etudiantSelect }, versements: { orderBy: { date: 'desc' } } },
    });

    return avecSolde(frais);
  }

  async findAll() {
    const tous = await this.prisma.fraisScolarite.findMany({
      include: { etudiant: { select: etudiantSelect }, versements: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return tous.map(avecSolde);
  }

  async findOne(id: number) {
    const frais = await this.prisma.fraisScolarite.findUnique({
      where: { id },
      include: { etudiant: { select: etudiantSelect }, versements: { orderBy: { date: 'desc' } } },
    });
    if (!frais) {
      throw new NotFoundException(`Frais scolaires ${id} introuvables`);
    }
    return avecSolde(frais);
  }

  async addVersement(fraisId: number, dto: CreateVersementDto) {
    await this.findOne(fraisId);
    await this.prisma.versement.create({
      data: { fraisId, montant: dto.montant, moyen: dto.moyen },
    });
    return this.findOne(fraisId);
  }
}
