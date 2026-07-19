import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreneauRdvDto } from './dto/create-creneau-rdv.dto';
import { ReserverCreneauDto } from './dto/reserver-creneau.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  role: true,
} as const;

const include = {
  organisateur: { select: userSelect },
  reservation: {
    include: {
      parent: { select: userSelect },
      etudiant: { select: userSelect },
    },
  },
} as const;

@Injectable()
export class RendezVousService {
  constructor(private readonly prisma: PrismaService) {}

  creerCreneau(dto: CreateCreneauRdvDto, currentUser: JwtPayload) {
    return this.prisma.creneauRendezVous.create({
      data: {
        date: new Date(dto.date),
        dureeMinutes: dto.dureeMinutes ?? 15,
        organisateurId: currentUser.sub,
      },
      include,
    });
  }

  getMesCreneaux(currentUser: JwtPayload) {
    return this.prisma.creneauRendezVous.findMany({
      where: { organisateurId: currentUser.sub },
      include,
      orderBy: { date: 'asc' },
    });
  }

  async getCreneauxDisponibles(currentUser: JwtPayload) {
    // Rendez-vous parent <-> administration : tous les créneaux libres ouverts par
    // un admin/chef d'établissement du même établissement que le parent.
    return this.prisma.creneauRendezVous.findMany({
      where: {
        organisateur: { etablissementId: currentUser.etablissementId },
        reservation: null,
        date: { gte: new Date() },
      },
      include,
      orderBy: { date: 'asc' },
    });
  }

  getMesReservations(currentUser: JwtPayload) {
    return this.prisma.creneauRendezVous.findMany({
      where: { reservation: { parentId: currentUser.sub } },
      include,
      orderBy: { date: 'asc' },
    });
  }

  async reserver(creneauId: number, dto: ReserverCreneauDto, currentUser: JwtPayload) {
    const creneau = await this.prisma.creneauRendezVous.findUnique({
      where: { id: creneauId },
      include: { reservation: true },
    });
    if (!creneau) {
      throw new NotFoundException(`Créneau ${creneauId} introuvable`);
    }
    if (creneau.reservation) {
      throw new ForbiddenException('Ce créneau est déjà réservé');
    }

    const enfant = await this.prisma.user.findFirst({
      where: { id: dto.etudiantId, parents: { some: { id: currentUser.sub } } },
    });
    if (!enfant) {
      throw new ForbiddenException("Cet étudiant n'est pas votre enfant");
    }

    await this.prisma.reservationRdv.create({
      data: {
        creneauId,
        parentId: currentUser.sub,
        etudiantId: dto.etudiantId,
        motif: dto.motif,
      },
    });

    return this.prisma.creneauRendezVous.findUnique({ where: { id: creneauId }, include });
  }

  async annulerReservation(creneauId: number, currentUser: JwtPayload) {
    const creneau = await this.prisma.creneauRendezVous.findUnique({
      where: { id: creneauId },
      include: { reservation: true },
    });
    if (!creneau || !creneau.reservation) {
      throw new NotFoundException('Réservation introuvable');
    }
    if (
      creneau.reservation.parentId !== currentUser.sub &&
      creneau.organisateurId !== currentUser.sub
    ) {
      throw new ForbiddenException("Vous n'êtes pas concerné par cette réservation");
    }

    await this.prisma.reservationRdv.delete({ where: { creneauId } });
    return this.prisma.creneauRendezVous.findUnique({ where: { id: creneauId }, include });
  }

  async supprimerCreneau(creneauId: number, currentUser: JwtPayload) {
    const creneau = await this.prisma.creneauRendezVous.findUnique({
      where: { id: creneauId },
      include: { reservation: true },
    });
    if (!creneau) {
      throw new NotFoundException(`Créneau ${creneauId} introuvable`);
    }
    if (creneau.organisateurId !== currentUser.sub) {
      throw new ForbiddenException('Ce créneau ne vous appartient pas');
    }
    if (creneau.reservation) {
      await this.prisma.reservationRdv.delete({ where: { creneauId } });
    }
    return this.prisma.creneauRendezVous.delete({ where: { id: creneauId } });
  }
}
