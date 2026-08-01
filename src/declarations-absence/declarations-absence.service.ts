import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeclarationAbsenceDto } from './dto/create-declaration-absence.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const etudiantSelect = { id: true, nom: true, prenom: true, numeroEtudiant: true, classeId: true } as const;
const declarantSelect = { id: true, nom: true, prenom: true } as const;

@Injectable()
export class DeclarationsAbsenceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDeclarationAbsenceDto, currentUser: JwtPayload) {
    if (currentUser.role === Role.PARENT) {
      const lien = await this.prisma.user.findFirst({
        where: { id: dto.etudiantId, parents: { some: { id: currentUser.sub } } },
      });
      if (!lien) {
        throw new ForbiddenException("Vous ne pouvez déclarer une absence que pour votre propre enfant");
      }
    }

    return this.prisma.declarationAbsenceParent.create({
      data: {
        etudiantId: dto.etudiantId,
        declarantId: currentUser.sub,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        raison: dto.raison,
        commentaire: dto.commentaire,
        justificatifNom: dto.justificatifNom,
        justificatifType: dto.justificatifType,
        justificatifData: dto.justificatifData,
      },
      include: { etudiant: { select: etudiantSelect }, declarant: { select: declarantSelect } },
    });
  }

  findAll(currentUser: JwtPayload) {
    const include = { etudiant: { select: etudiantSelect }, declarant: { select: declarantSelect } };

    if (currentUser.role === Role.PARENT) {
      return this.prisma.declarationAbsenceParent.findMany({
        where: { declarantId: currentUser.sub },
        include,
        orderBy: { createdAt: 'desc' },
      });
    }
    if (currentUser.role === Role.ETUDIANT) {
      return this.prisma.declarationAbsenceParent.findMany({
        where: { etudiantId: currentUser.sub },
        include,
        orderBy: { createdAt: 'desc' },
      });
    }
    // ADMIN, CHEF_ETABLISSEMENT, VIE_SCOLAIRE : toutes les déclarations de l'établissement
    return this.prisma.declarationAbsenceParent.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async changerStatut(id: number, statut: 'VALIDEE' | 'REFUSEE') {
    const declaration = await this.prisma.declarationAbsenceParent.findUnique({ where: { id } });
    if (!declaration) {
      throw new NotFoundException(`Déclaration ${id} introuvable`);
    }
    return this.prisma.declarationAbsenceParent.update({
      where: { id },
      data: { statut },
    });
  }
}
