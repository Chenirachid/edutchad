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

// L'inscription pédagogique n'est jamais validée à la main : elle reflète simplement
// le fait qu'un administrateur a affecté l'élève à une classe (classeId renseigné).
function avecStatutPedagogiqueCalcule<T extends { etudiant: { classeId: number | null } }>(inscription: T) {
  return {
    ...inscription,
    statutPedagogique: inscription.etudiant.classeId
      ? StatutInscriptionAdmin.VALIDEE
      : StatutInscriptionAdmin.EN_ATTENTE,
  };
}

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

    const statutPedagogique = etudiant.classeId
      ? StatutInscriptionAdmin.VALIDEE
      : StatutInscriptionAdmin.EN_ATTENTE;
    const dateValidationPedagogique = etudiant.classeId ? new Date() : null;

    const inscription = await this.prisma.inscriptionAdministrative.upsert({
      where: {
        etudiantId_anneeScolaire: { etudiantId: etudiant.id, anneeScolaire: dto.anneeScolaire },
      },
      create: {
        etudiantId: etudiant.id,
        anneeScolaire: dto.anneeScolaire,
        dateNaissance: new Date(dto.dateNaissance),
        emailContact: dto.emailContact,
        telephoneContact: dto.telephoneContact,
        statutPedagogique,
        dateValidationPedagogique,
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
        emailContact: dto.emailContact,
        telephoneContact: dto.telephoneContact,
        statutPedagogique,
        dateValidationPedagogique,
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
    return avecStatutPedagogiqueCalcule(inscription);
  }

  async findAll() {
    const inscriptions = await this.prisma.inscriptionAdministrative.findMany({
      include: { etudiant: { select: etudiantSelect } },
      orderBy: { createdAt: 'desc' },
    });
    return inscriptions.map(avecStatutPedagogiqueCalcule);
  }

  async findByEtudiant(etudiantId: number) {
    const inscriptions = await this.prisma.inscriptionAdministrative.findMany({
      where: { etudiantId },
      include: { etudiant: { select: etudiantSelect } },
      orderBy: { createdAt: 'desc' },
    });
    return inscriptions.map(avecStatutPedagogiqueCalcule);
  }

  async updateStatut(id: number, dto: UpdateStatutInscriptionDto) {
    const inscription = await this.prisma.inscriptionAdministrative.findUnique({
      where: { id },
      include: { etudiant: { select: etudiantSelect } },
    });
    if (!inscription) {
      throw new NotFoundException(`Inscription administrative ${id} introuvable`);
    }

    const misAJour = await this.prisma.inscriptionAdministrative.update({
      where: { id },
      data: {
        statut: dto.statut,
        dateValidation: dto.statut === StatutInscriptionAdmin.VALIDEE ? new Date() : null,
      },
      include: { etudiant: { select: etudiantSelect } },
    });
    return avecStatutPedagogiqueCalcule(misAJour);
  }
}
