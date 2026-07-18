import { Injectable, NotFoundException } from '@nestjs/common';
import { StatutInscriptionAdmin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInscriptionAdminDto } from './dto/create-inscription-admin.dto';
import { UpdateStatutInscriptionDto } from './dto/update-statut-inscription.dto';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  numeroEtudiant: true,
  classeId: true,
} as const;

@Injectable()
export class InscriptionsAdministrativesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInscriptionAdminDto) {
    const etudiant = await this.prisma.user.findUnique({
      where: { numeroEtudiant: dto.numeroEtudiant },
    });
    if (!etudiant) {
      throw new NotFoundException(`Aucun étudiant avec le numéro ${dto.numeroEtudiant}`);
    }

    return this.prisma.inscriptionAdministrative.upsert({
      where: {
        etudiantId_anneeScolaire: { etudiantId: etudiant.id, anneeScolaire: dto.anneeScolaire },
      },
      create: {
        etudiantId: etudiant.id,
        anneeScolaire: dto.anneeScolaire,
        dateNaissance: new Date(dto.dateNaissance),
        typeJustificatif: dto.typeJustificatif,
        justificatifNom: dto.justificatifNom,
        justificatifType: dto.justificatifType,
        justificatifData: dto.justificatifData,
        vientDAutreEtablissement: dto.vientDAutreEtablissement,
        justificatifTransfertNom: dto.justificatifTransfertNom,
        justificatifTransfertType: dto.justificatifTransfertType,
        justificatifTransfertData: dto.justificatifTransfertData,
      },
      update: {
        dateNaissance: new Date(dto.dateNaissance),
        typeJustificatif: dto.typeJustificatif,
        justificatifNom: dto.justificatifNom,
        justificatifType: dto.justificatifType,
        justificatifData: dto.justificatifData,
        vientDAutreEtablissement: dto.vientDAutreEtablissement,
        justificatifTransfertNom: dto.justificatifTransfertNom,
        justificatifTransfertType: dto.justificatifTransfertType,
        justificatifTransfertData: dto.justificatifTransfertData,
      },
      include: { etudiant: { select: etudiantSelect } },
    });
  }

  findAll() {
    return this.prisma.inscriptionAdministrative.findMany({
      include: { etudiant: { select: etudiantSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEtudiant(etudiantId: number) {
    return this.prisma.inscriptionAdministrative.findMany({
      where: { etudiantId },
      include: { etudiant: { select: etudiantSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatut(id: number, dto: UpdateStatutInscriptionDto) {
    const inscription = await this.prisma.inscriptionAdministrative.findUnique({ where: { id } });
    if (!inscription) {
      throw new NotFoundException(`Inscription administrative ${id} introuvable`);
    }

    return this.prisma.inscriptionAdministrative.update({
      where: { id },
      data: {
        statut: dto.statut,
        dateValidation: dto.statut === StatutInscriptionAdmin.VALIDEE ? new Date() : null,
      },
      include: { etudiant: { select: etudiantSelect } },
    });
  }
}
