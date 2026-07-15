import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtablissementDto } from './dto/create-etablissement.dto';

@Injectable()
export class EtablissementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEtablissementDto) {
    const existant = await this.prisma.etablissement.findUnique({
      where: { code: dto.code },
    });
    if (existant) {
      throw new ConflictException(`Le code "${dto.code}" est déjà utilisé`);
    }

    const etablissement = await this.prisma.etablissement.create({
      data: { nom: dto.nom, code: dto.code },
    });

    // Crée automatiquement les paramètres par défaut de ce nouvel établissement
    await this.prisma.parametrePlateforme.create({
      data: { nomEtablissement: dto.nom, etablissementId: etablissement.id },
    });

    return etablissement;
  }

  async findAll() {
    const etablissements = await this.prisma.etablissement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      etablissements.map(async (e) => {
        const [nbUtilisateurs, nbClasses] = await Promise.all([
          this.prisma.user.count({ where: { etablissementId: e.id } }),
          this.prisma.classe.count({ where: { etablissementId: e.id } }),
        ]);
        return { ...e, nbUtilisateurs, nbClasses };
      }),
    );
  }

  async findOne(id: number) {
    const etablissement = await this.prisma.etablissement.findUnique({ where: { id } });
    if (!etablissement) {
      throw new NotFoundException(`Établissement ${id} introuvable`);
    }
    return etablissement;
  }
}
