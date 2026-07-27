import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDossierProfesseurDto } from './dto/create-dossier-professeur.dto';
import { AddDocumentProfesseurDto } from './dto/add-document-professeur.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class DossiersProfesseurService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAcces(professeurId: number, currentUser: JwtPayload) {
    if (currentUser.role === Role.PROFESSEUR && currentUser.sub !== professeurId) {
      throw new ForbiddenException("Vous ne pouvez gérer que votre propre dossier");
    }
  }

  async upsert(
    professeurId: number,
    dto: CreateDossierProfesseurDto,
    currentUser: JwtPayload,
  ) {
    this.assertAcces(professeurId, currentUser);

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

  async findOne(professeurId: number, currentUser: JwtPayload) {
    this.assertAcces(professeurId, currentUser);

    const dossier = await this.prisma.dossierProfesseur.findUnique({
      where: { professeurId },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });
    // Pas d'exception si le dossier n'existe pas encore : le prof doit pouvoir
    // arriver sur une page vide pour créer son dossier la première fois.
    return dossier;
  }

  async ajouterDocument(
    professeurId: number,
    dto: AddDocumentProfesseurDto,
    currentUser: JwtPayload,
  ) {
    this.assertAcces(professeurId, currentUser);

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

  async supprimerDocument(documentId: number, currentUser: JwtPayload) {
    const document = await this.prisma.documentProfesseur.findUnique({
      where: { id: documentId },
      include: { dossier: true },
    });
    if (!document) {
      throw new NotFoundException(`Document ${documentId} introuvable`);
    }
    this.assertAcces(document.dossier.professeurId, currentUser);
    return this.prisma.documentProfesseur.delete({ where: { id: documentId } });
  }

  // Seul l'admin (ou le chef d'établissement, via le bypass des rôles) valide un document —
  // le professeur ne peut jamais changer le statut de son propre document.
  async validerDocument(documentId: number, statut: 'VALIDE' | 'REFUSE') {
    const document = await this.prisma.documentProfesseur.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document ${documentId} introuvable`);
    }
    return this.prisma.documentProfesseur.update({
      where: { id: documentId },
      data: { statut },
    });
  }
}
