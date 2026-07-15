import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, TypeGroupe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageGroupeDto } from './dto/create-message-groupe.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const auteurSelect = {
  id: true,
  nom: true,
  prenom: true,
  role: true,
} as const;

@Injectable()
export class GroupesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateClasseGroupe(classeId: number) {
    const existing = await this.prisma.groupe.findUnique({ where: { classeId } });
    if (existing) return existing;

    const classe = await this.prisma.classe.findUnique({ where: { id: classeId } });
    if (!classe) throw new NotFoundException(`Classe ${classeId} introuvable`);

    return this.prisma.groupe.create({
      data: {
        nom: `Classe ${classe.nom}`,
        type: TypeGroupe.CLASSE,
        classeId,
        etablissementId: classe.etablissementId,
      },
    });
  }

  private async getOrCreateSingleton(
    type: TypeGroupe.PROFS | TypeGroupe.ADMIN,
    etablissementId: number | null,
  ) {
    const existing = await this.prisma.groupe.findFirst({
      where: { type, classeId: null, etablissementId },
    });
    if (existing) return existing;

    return this.prisma.groupe.create({
      data: {
        nom: type === TypeGroupe.PROFS ? 'Salle des professeurs' : 'Administration',
        type,
        etablissementId,
      },
    });
  }

  async getMesGroupes(user: JwtPayload) {
    const groupes: Awaited<ReturnType<typeof this.getOrCreateClasseGroupe>>[] = [];

    if (user.role === Role.ETUDIANT) {
      const etudiant = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { classeId: true },
      });
      if (etudiant?.classeId) {
        groupes.push(await this.getOrCreateClasseGroupe(etudiant.classeId));
      }
    }

    if (user.role === Role.PROFESSEUR) {
      groupes.push(await this.getOrCreateSingleton(TypeGroupe.PROFS, user.etablissementId));
      const enseignements = await this.prisma.enseignement.findMany({
        where: { professeurId: user.sub },
        select: { classeId: true },
        distinct: ['classeId'],
      });
      for (const e of enseignements) {
        groupes.push(await this.getOrCreateClasseGroupe(e.classeId));
      }
    }

    if (user.role === Role.ADMIN || user.role === Role.VIE_SCOLAIRE) {
      groupes.push(await this.getOrCreateSingleton(TypeGroupe.PROFS, user.etablissementId));
      groupes.push(await this.getOrCreateSingleton(TypeGroupe.ADMIN, user.etablissementId));
      const classes = await this.prisma.classe.findMany({
        where: { etablissementId: user.etablissementId },
        select: { id: true },
      });
      for (const c of classes) {
        groupes.push(await this.getOrCreateClasseGroupe(c.id));
      }
    }

    return groupes;
  }

  private async assertAcces(groupeId: number, user: JwtPayload) {
    const groupe = await this.prisma.groupe.findUnique({ where: { id: groupeId } });
    if (!groupe) throw new NotFoundException(`Groupe ${groupeId} introuvable`);

    if (
      (user.role === Role.ADMIN || user.role === Role.VIE_SCOLAIRE) &&
      groupe.etablissementId === user.etablissementId
    )
      return groupe;

    if (groupe.type === TypeGroupe.CLASSE) {
      if (user.role === Role.ETUDIANT) {
        const etudiant = await this.prisma.user.findUnique({
          where: { id: user.sub },
          select: { classeId: true },
        });
        if (etudiant?.classeId === groupe.classeId) return groupe;
      }
      if (user.role === Role.PROFESSEUR) {
        const enseigne = await this.prisma.enseignement.findFirst({
          where: { classeId: groupe.classeId!, professeurId: user.sub },
        });
        if (enseigne) return groupe;
      }
    }

    if (
      groupe.type === TypeGroupe.PROFS &&
      user.role === Role.PROFESSEUR &&
      groupe.etablissementId === user.etablissementId
    )
      return groupe;

    throw new ForbiddenException("Vous n'avez pas accès à ce groupe");
  }

  async getMessages(groupeId: number, user: JwtPayload) {
    await this.assertAcces(groupeId, user);
    return this.prisma.messageGroupe.findMany({
      where: { groupeId },
      include: { auteur: { select: auteurSelect } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async postMessage(groupeId: number, dto: CreateMessageGroupeDto, user: JwtPayload) {
    await this.assertAcces(groupeId, user);
    return this.prisma.messageGroupe.create({
      data: { contenu: dto.contenu, groupeId, auteurId: user.sub },
      include: { auteur: { select: auteurSelect } },
    });
  }
}
