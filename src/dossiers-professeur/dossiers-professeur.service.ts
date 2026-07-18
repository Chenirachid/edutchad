import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDossierProfesseurDto } from './dto/create-dossier-professeur.dto';
import { AddDocumentProfesseurDto } from './dto/add-document-professeur.dto';

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
      },
      update: {
        dateNaissance: new Date(dto.dateNaissance),
        justification: dto.justification,
      },
      include: { documents: true },
    });
  }

  async findOne(professeurId: number) {
    const dossier = await this.prisma.dossierProfesseur.findUnique({
      where: { professeurId },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });
    if (!dossier) {
      throw new NotFoundException('Aucun dossier trouvé pour ce professeur');
    }
    return dossier;
  }

  async ajouterDocument(professeurId: number, dto: AddDocumentProfesseurDto) {
    const dossier = await this.prisma.dossierProfesseur.findUnique({ where: { professeurId } });
    if (!dossier) {
      throw new NotFoundException(
        "Il faut d'abord enregistrer les informations de base du dossier avant d'ajouter un document",
      );
    }

    return this.prisma.documentProfesseur.create({
      data: {
        dossierId: dossier.id,
        categorie: dto.categorie,
        nom: dto.nom,
        type: dto.type,
        data: dto.data,
      },
    });
  }

  async supprimerDocument(documentId: number) {
    const document = await this.prisma.documentProfesseur.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document ${documentId} introuvable`);
    }
    return this.prisma.documentProfesseur.delete({ where: { id: documentId } });
  }
}
