import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const contactSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(currentUser: JwtPayload, dto: CreateMessageDto) {
    if (!dto.destinataireId && !dto.destinataireEmail) {
      throw new BadRequestException("Précise un destinataire (ID ou email)");
    }

    const destinataire = dto.destinataireEmail
      ? await this.prisma.user.findUnique({ where: { email: dto.destinataireEmail } })
      : await this.prisma.user.findUnique({ where: { id: dto.destinataireId } });

    if (!destinataire) {
      throw new NotFoundException(
        dto.destinataireEmail
          ? `Aucun utilisateur avec l'email ${dto.destinataireEmail}`
          : `Utilisateur ${dto.destinataireId} introuvable`,
      );
    }

    if (destinataire.id === currentUser.sub) {
      throw new BadRequestException('Vous ne pouvez pas vous envoyer un message à vous-même');
    }

    if (currentUser.role === Role.CHEF_PROJET) {
      if (destinataire.role !== Role.CHEF_ETABLISSEMENT) {
        throw new ForbiddenException(
          "Le chef de projet ne peut envoyer un message qu'à des chefs d'établissement",
        );
      }
    } else if (destinataire.role === Role.CHEF_PROJET) {
      if (currentUser.role !== Role.CHEF_ETABLISSEMENT) {
        throw new ForbiddenException(
          "Seul un chef d'établissement peut contacter le chef de projet",
        );
      }
    } else if (destinataire.etablissementId !== currentUser.etablissementId) {
      throw new ForbiddenException(
        "Vous ne pouvez contacter que des personnes de votre établissement",
      );
    }

    return this.prisma.message.create({
      data: {
        contenu: dto.contenu,
        expediteurId: currentUser.sub,
        destinataireId: destinataire.id,
      },
      include: {
        expediteur: { select: contactSelect },
        destinataire: { select: contactSelect },
      },
    });
  }

  recus(userId: number) {
    return this.prisma.message.findMany({
      where: { destinataireId: userId },
      include: { expediteur: { select: contactSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  envoyes(userId: number) {
    return this.prisma.message.findMany({
      where: { expediteurId: userId },
      include: { destinataire: { select: contactSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  conversation(userId: number, autreUserId: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { expediteurId: userId, destinataireId: autreUserId },
          { expediteurId: autreUserId, destinataireId: userId },
        ],
      },
      include: {
        expediteur: { select: contactSelect },
        destinataire: { select: contactSelect },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async marquerLu(id: number, userId: number) {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message ${id} introuvable`);
    }
    if (message.destinataireId !== userId) {
      throw new ForbiddenException("Seul le destinataire peut marquer ce message comme lu");
    }
    return this.prisma.message.update({ where: { id }, data: { lu: true } });
  }

  async remove(id: number, userId: number) {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message ${id} introuvable`);
    }
    if (message.expediteurId !== userId && message.destinataireId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à ce message");
    }
    return this.prisma.message.delete({ where: { id } });
  }

  countNonLus(userId: number) {
    return this.prisma.message.count({
      where: { destinataireId: userId, lu: false },
    });
  }

  contacts(currentUser: JwtPayload) {
    const where: Prisma.UserWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? { role: Role.CHEF_ETABLISSEMENT }
        : currentUser.role === Role.CHEF_ETABLISSEMENT
          ? { id: { not: currentUser.sub }, OR: [{ etablissementId: currentUser.etablissementId }, { role: Role.CHEF_PROJET }] }
          : { id: { not: currentUser.sub }, etablissementId: currentUser.etablissementId };

    return this.prisma.user.findMany({
      where,
      select: contactSelect,
      orderBy: { nom: 'asc' },
    });
  }
}
