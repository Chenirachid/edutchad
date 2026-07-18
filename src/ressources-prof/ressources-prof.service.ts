import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRessourceProfDto } from './dto/create-ressource-prof.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class RessourcesProfService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRessourceProfDto, currentUser: JwtPayload) {
    return this.prisma.ressourceProf.create({
      data: {
        titre: dto.titre,
        nom: dto.nom,
        type: dto.type,
        data: dto.data,
        professeurId: currentUser.sub,
      },
    });
  }

  findMine(currentUser: JwtPayload) {
    return this.prisma.ressourceProf.findMany({
      where: { professeurId: currentUser.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const ressource = await this.prisma.ressourceProf.findUnique({ where: { id } });
    if (!ressource) {
      throw new NotFoundException(`Ressource ${id} introuvable`);
    }
    if (ressource.professeurId !== currentUser.sub) {
      throw new ForbiddenException('Ce document ne vous appartient pas');
    }
    return this.prisma.ressourceProf.delete({ where: { id } });
  }
}
