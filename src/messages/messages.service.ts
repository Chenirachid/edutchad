import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

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

  async send(expediteurId: number, dto: CreateMessageDto) {
    if (dto.destinataireId === expediteurId) {
      throw new BadRequestException('Vous ne pouvez pas vous envoyer un message à vous-même');
    }

    const destinataire = await this.prisma.user.findUnique({
      where: { id: dto.destinataireId },
    });
    if (!destinataire) {
      throw new NotFoundException(`Utilisateur ${dto.destinataireId} introuvable`);
    }

    return this.prisma.message.create({
      data: {
        contenu: dto.contenu,
        expediteurId,
        destinataireId: dto.destinataireId,
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

  contacts(userId: number) {
    return this.prisma.user.findMany({
      where: { id: { not: userId } },
      select: contactSelect,
      orderBy: { nom: 'asc' },
    });
  }
}
