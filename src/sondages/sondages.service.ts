import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSondageDto } from './dto/create-sondage.dto';
import { VoterSondageDto } from './dto/voter-sondage.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const include = {
  auteur: { select: { id: true, nom: true, prenom: true } },
  options: { include: { _count: { select: { votes: true } } } },
} as const;

@Injectable()
export class SondagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSondageDto, currentUser: JwtPayload) {
    return this.prisma.sondage.create({
      data: {
        question: dto.question,
        auteurId: currentUser.sub,
        etablissementId: currentUser.etablissementId,
        options: { create: dto.options.map((texte) => ({ texte })) },
      },
      include,
    });
  }

  async findAll(currentUser: JwtPayload) {
    const where: Prisma.SondageWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    const sondages = await this.prisma.sondage.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    });

    const mesVotes = await this.prisma.voteSondage.findMany({
      where: { votantId: currentUser.sub, sondageId: { in: sondages.map((s) => s.id) } },
    });
    const voteParSondage = new Map(mesVotes.map((v) => [v.sondageId, v.optionId]));

    return sondages.map((s) => {
      const totalVotes = s.options.reduce((acc, o) => acc + o._count.votes, 0);
      return {
        ...s,
        totalVotes,
        monVoteOptionId: voteParSondage.get(s.id) ?? null,
        options: s.options.map((o) => ({
          id: o.id,
          texte: o.texte,
          nbVotes: o._count.votes,
        })),
      };
    });
  }

  async voter(sondageId: number, dto: VoterSondageDto, currentUser: JwtPayload) {
    const sondage = await this.prisma.sondage.findUnique({
      where: { id: sondageId },
      include: { options: true },
    });
    if (!sondage) {
      throw new NotFoundException(`Sondage ${sondageId} introuvable`);
    }
    if (sondage.cloture) {
      throw new ForbiddenException('Ce sondage est clôturé');
    }
    if (!sondage.options.some((o) => o.id === dto.optionId)) {
      throw new BadRequestException("Cette option n'appartient pas à ce sondage");
    }

    await this.prisma.voteSondage.upsert({
      where: { sondageId_votantId: { sondageId, votantId: currentUser.sub } },
      create: { sondageId, optionId: dto.optionId, votantId: currentUser.sub },
      update: { optionId: dto.optionId },
    });

    const tous = await this.findAll(currentUser);
    return tous.find((s) => s.id === sondageId);
  }

  async cloturer(sondageId: number) {
    const sondage = await this.prisma.sondage.findUnique({ where: { id: sondageId } });
    if (!sondage) {
      throw new NotFoundException(`Sondage ${sondageId} introuvable`);
    }
    return this.prisma.sondage.update({
      where: { id: sondageId },
      data: { cloture: !sondage.cloture },
      include,
    });
  }

  async remove(sondageId: number, currentUser: JwtPayload) {
    const sondage = await this.prisma.sondage.findUnique({ where: { id: sondageId } });
    if (!sondage) {
      throw new NotFoundException(`Sondage ${sondageId} introuvable`);
    }
    if (currentUser.role !== Role.CHEF_PROJET && sondage.auteurId !== currentUser.sub) {
      throw new ForbiddenException("Seul l'auteur ou le chef de projet peut supprimer ce sondage");
    }
    await this.prisma.voteSondage.deleteMany({ where: { sondageId } });
    await this.prisma.optionSondage.deleteMany({ where: { sondageId } });
    return this.prisma.sondage.delete({ where: { id: sondageId } });
  }
}
