import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReunionDto } from './dto/create-reunion.dto';
import { RepondreInvitationDto } from './dto/repondre-invitation.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  role: true,
} as const;

const include = {
  organisateur: { select: userSelect },
  invitations: { include: { invite: { select: userSelect } } },
} as const;

@Injectable()
export class ReunionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReunionDto, currentUser: JwtPayload) {
    const invites = await this.prisma.user.findMany({
      where: { id: { in: dto.inviteIds } },
    });
    if (invites.length !== dto.inviteIds.length) {
      throw new NotFoundException("Un ou plusieurs invités sont introuvables");
    }

    return this.prisma.reunion.create({
      data: {
        sujet: dto.sujet,
        lieu: dto.lieu,
        date: new Date(dto.date),
        organisateurId: currentUser.sub,
        invitations: {
          create: dto.inviteIds.map((inviteId) => ({ inviteId })),
        },
      },
      include,
    });
  }

  findAll(currentUser: JwtPayload) {
    if (currentUser.role === Role.ADMIN) {
      return this.prisma.reunion.findMany({ include, orderBy: { date: 'asc' } });
    }

    return this.prisma.reunion.findMany({
      where: { invitations: { some: { inviteId: currentUser.sub } } },
      include,
      orderBy: { date: 'asc' },
    });
  }

  async repondre(reunionId: number, dto: RepondreInvitationDto, currentUser: JwtPayload) {
    const invitation = await this.prisma.invitationReunion.findUnique({
      where: { reunionId_inviteId: { reunionId, inviteId: currentUser.sub } },
    });
    if (!invitation) {
      throw new ForbiddenException("Vous n'êtes pas invité à cette réunion");
    }

    await this.prisma.invitationReunion.update({
      where: { id: invitation.id },
      data: { reponse: dto.reponse },
    });

    return this.prisma.reunion.findUnique({ where: { id: reunionId }, include });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const reunion = await this.prisma.reunion.findUnique({ where: { id } });
    if (!reunion) {
      throw new NotFoundException(`Réunion ${id} introuvable`);
    }
    if (currentUser.role !== Role.ADMIN && reunion.organisateurId !== currentUser.sub) {
      throw new ForbiddenException("Seul l'organisateur ou un admin peut supprimer cette réunion");
    }
    await this.prisma.invitationReunion.deleteMany({ where: { reunionId: id } });
    return this.prisma.reunion.delete({ where: { id } });
  }
}
