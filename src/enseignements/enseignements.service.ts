import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnseignementDto } from './dto/create-enseignement.dto';

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
} as const;

@Injectable()
export class EnseignementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnseignementDto) {
    const [classe, matiere, professeur] = await Promise.all([
      this.prisma.classe.findUnique({ where: { id: dto.classeId } }),
      this.prisma.matiere.findUnique({ where: { id: dto.matiereId } }),
      this.prisma.user.findUnique({ where: { id: dto.professeurId } }),
    ]);

    if (!classe) throw new NotFoundException(`Classe ${dto.classeId} introuvable`);
    if (!matiere) throw new NotFoundException(`Matière ${dto.matiereId} introuvable`);
    if (!professeur) throw new NotFoundException(`Utilisateur ${dto.professeurId} introuvable`);
    if (professeur.role !== Role.PROFESSEUR) {
      throw new BadRequestException(
        `L'utilisateur ${dto.professeurId} n'a pas le rôle PROFESSEUR`,
      );
    }

    return this.prisma.enseignement.create({
      data: {
        classeId: dto.classeId,
        matiereId: dto.matiereId,
        professeurId: dto.professeurId,
      },
      include: { classe: true, matiere: true, professeur: { select: professeurSelect } },
    });
  }

  findAll() {
    return this.prisma.enseignement.findMany({
      include: { classe: true, matiere: true, professeur: { select: professeurSelect } },
    });
  }

  async findOne(id: number) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id },
      include: { classe: true, matiere: true, professeur: { select: professeurSelect } },
    });

    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${id} introuvable`);
    }

    return enseignement;
  }

  async getEtudiants(id: number, currentUser: { sub: number; role: Role }) {
    const enseignement = await this.findOne(id);

    if (
      currentUser.role === Role.PROFESSEUR &&
      enseignement.professeur.id !== currentUser.sub
    ) {
      throw new BadRequestException(
        "Vous n'enseignez pas dans cette classe/matière",
      );
    }

    const classe = await this.prisma.classe.findUnique({
      where: { id: enseignement.classeId },
      include: { etudiants: { select: etudiantSelect, orderBy: { nom: 'asc' } } },
    });

    return classe?.etudiants ?? [];
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.enseignement.delete({ where: { id } });
  }
}
