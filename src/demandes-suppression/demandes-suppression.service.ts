import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatutDemande } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TraiterDemandeDto } from './dto/traiter-demande.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
} as const;

const include = {
  cible: { select: userSelect },
  demandeur: { select: userSelect },
  traitePar: { select: userSelect },
} as const;

@Injectable()
export class DemandesSuppressionService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.demandeSuppressionAdmin.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async traiter(id: number, dto: TraiterDemandeDto, currentUser: JwtPayload) {
    const demande = await this.prisma.demandeSuppressionAdmin.findUnique({
      where: { id },
    });
    if (!demande) {
      throw new NotFoundException(`Demande ${id} introuvable`);
    }
    if (demande.statut !== StatutDemande.EN_ATTENTE) {
      throw new ForbiddenException('Cette demande a déjà été traitée');
    }

    if (dto.decision === 'APPROUVEE') {
      await this.prisma.user.delete({ where: { id: demande.cibleId } });
    }

    return this.prisma.demandeSuppressionAdmin.update({
      where: { id },
      data: {
        statut: dto.decision === 'APPROUVEE' ? StatutDemande.APPROUVEE : StatutDemande.REJETEE,
        traiteParId: currentUser.sub,
        traiteLe: new Date(),
      },
      include,
    });
  }
}
