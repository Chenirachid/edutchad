import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class AppelFaitService {
  constructor(private readonly prisma: PrismaService) {}

  async marquerFait(enseignementId: number, date: string, currentUser: JwtPayload) {
    const enseignement = await this.prisma.enseignement.findUnique({ where: { id: enseignementId } });
    if (!enseignement) return null;
    if (currentUser.role === Role.PROFESSEUR && enseignement.professeurId !== currentUser.sub) {
      throw new ForbiddenException("Cet enseignement ne vous appartient pas");
    }
    const jourSeul = new Date(date);
    jourSeul.setUTCHours(0, 0, 0, 0);
    return this.prisma.appelFait.upsert({
      where: { enseignementId_date: { enseignementId, date: jourSeul } },
      create: { enseignementId, date: jourSeul },
      update: {},
    });
  }

  // Renvoie la liste des appels déjà faits pour les enseignements du prof connecté,
  // sur une période donnée (par défaut : aujourd'hui).
  async listerPourProf(currentUser: JwtPayload) {
    return this.prisma.appelFait.findMany({
      where: { enseignement: { professeurId: currentUser.sub } },
    });
  }
}
