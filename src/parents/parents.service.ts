import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLiaisonDto } from './dto/create-liaison.dto';

const enfantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  classeId: true,
} as const;

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLiaison(dto: CreateLiaisonDto) {
    const [parent, enfant] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.parentId } }),
      this.prisma.user.findUnique({ where: { id: dto.enfantId } }),
    ]);

    if (!parent) throw new NotFoundException(`Utilisateur ${dto.parentId} introuvable`);
    if (!enfant) throw new NotFoundException(`Utilisateur ${dto.enfantId} introuvable`);

    if (parent.role !== Role.PARENT) {
      throw new BadRequestException(
        `L'utilisateur ${dto.parentId} n'a pas le rôle PARENT`,
      );
    }
    if (enfant.role !== Role.ETUDIANT) {
      throw new BadRequestException(
        `L'utilisateur ${dto.enfantId} n'a pas le rôle ETUDIANT`,
      );
    }

    await this.prisma.user.update({
      where: { id: dto.parentId },
      data: { enfants: { connect: { id: dto.enfantId } } },
    });

    return this.getEnfants(dto.parentId);
  }

  async removeLiaison(dto: CreateLiaisonDto) {
    await this.prisma.user.update({
      where: { id: dto.parentId },
      data: { enfants: { disconnect: { id: dto.enfantId } } },
    });

    return this.getEnfants(dto.parentId);
  }

  async getEnfants(parentId: number) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
      include: { enfants: { select: enfantSelect } },
    });

    if (!parent) {
      throw new NotFoundException(`Utilisateur ${parentId} introuvable`);
    }

    return parent.enfants;
  }
}
