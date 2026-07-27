import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRessourceBibliothequeDto } from './dto/create-ressource-bibliotheque.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const ajouteParSelect = {
  id: true,
  nom: true,
  prenom: true,
} as const;

// Champ volontairement exclu par défaut : "data" (le contenu du fichier), pour ne pas
// alourdir la liste — récupéré séparément au moment du téléchargement.
const selectSansContenu = {
  id: true,
  titre: true,
  description: true,
  matiere: true,
  nom: true,
  type: true,
  reserveProf: true,
  createdAt: true,
  ajoutePar: { select: ajouteParSelect },
} as const;

@Injectable()
export class BibliothequeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRessourceBibliothequeDto, currentUser: JwtPayload) {
    return this.prisma.ressourceBibliotheque.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        matiere: dto.matiere,
        nom: dto.nom,
        type: dto.type,
        data: dto.data,
        reserveProf: dto.reserveProf ?? false,
        ajouteParId: currentUser.sub,
        etablissementId: currentUser.etablissementId,
      },
      select: selectSansContenu,
    });
  }

  findAll(currentUser: JwtPayload) {
    const peutVoirReserve =
      currentUser.role === Role.PROFESSEUR ||
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.CHEF_ETABLISSEMENT;

    return this.prisma.ressourceBibliotheque.findMany({
      where: {
        etablissementId: currentUser.etablissementId,
        ...(peutVoirReserve ? {} : { reserveProf: false }),
      },
      select: selectSansContenu,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAvecContenu(id: number, currentUser: JwtPayload) {
    const ressource = await this.prisma.ressourceBibliotheque.findUnique({
      where: { id },
    });
    if (!ressource) {
      throw new NotFoundException(`Ressource ${id} introuvable`);
    }

    const peutVoirReserve =
      currentUser.role === Role.PROFESSEUR ||
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.CHEF_ETABLISSEMENT;

    if (ressource.reserveProf && !peutVoirReserve) {
      throw new ForbiddenException(
        'Cette ressource est réservée aux professeurs et à l\u2019administration',
      );
    }

    return ressource;
  }

  async remove(id: number, currentUser: JwtPayload) {
    const ressource = await this.prisma.ressourceBibliotheque.findUnique({ where: { id } });
    if (!ressource) {
      throw new NotFoundException(`Ressource ${id} introuvable`);
    }
    if (
      currentUser.role === Role.PROFESSEUR &&
      ressource.ajouteParId !== currentUser.sub
    ) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres ajouts');
    }
    return this.prisma.ressourceBibliotheque.delete({ where: { id } });
  }
}
