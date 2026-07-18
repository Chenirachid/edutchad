import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDossierProfesseurDto } from './dto/create-dossier-professeur.dto';

@Injectable()
export class DossiersProfesseurService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(professeurId: number, dto: CreateDossierProfesseurDto) {
    const professeur = await this.prisma.user.findUnique({ where: { id: professeurId } });
    if (!professeur) {
      throw new NotFoundException(`Professeur ${professeurId} introuvable`);
    }

    return this.prisma.dossierProfesseur.upsert({
      where: { professeurId },
      create: {
        professeurId,
        dateNaissance: new Date(dto.dateNaissance),
        justification: dto.justification,
        diplomeNom: dto.diplomeNom,
        diplomeType: dto.diplomeType,
        diplomeData: dto.diplomeData,
      },
      update: {
        dateNaissance: new Date(dto.dateNaissance),
        justification: dto.justification,
        diplomeNom: dto.diplomeNom,
        diplomeType: dto.diplomeType,
        diplomeData: dto.diplomeData,
      },
    });
  }

  async findOne(professeurId: number) {
    const dossier = await this.prisma.dossierProfesseur.findUnique({ where: { professeurId } });
    if (!dossier) {
      throw new NotFoundException('Aucun dossier trouvé pour ce professeur');
    }
    return dossier;
  }
}
