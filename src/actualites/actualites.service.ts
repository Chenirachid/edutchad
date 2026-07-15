import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActualiteDto } from './dto/create-actualite.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const include = {
  auteur: { select: { id: true, nom: true, prenom: true, role: true } },
} as const;

@Injectable()
export class ActualitesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateActualiteDto, currentUser: JwtPayload) {
    return this.prisma.actualite.create({
      data: {
        titre: dto.titre,
        contenu: dto.contenu,
        auteurId: currentUser.sub,
        etablissementId: currentUser.etablissementId,
      },
      include,
    });
  }

  findAll(currentUser: JwtPayload) {
    const where: Prisma.ActualiteWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    return this.prisma.actualite.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const actualite = await this.prisma.actualite.findUnique({ where: { id } });
    if (!actualite) {
      throw new NotFoundException(`Actualité ${id} introuvable`);
    }
    if (
      currentUser.role !== Role.CHEF_PROJET &&
      actualite.auteurId !== currentUser.sub
    ) {
      throw new ForbiddenException("Seul l'auteur ou le chef de projet peut supprimer cette actualité");
    }
    return this.prisma.actualite.delete({ where: { id } });
  }
}
