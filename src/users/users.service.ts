import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { buildBaseEmail, formatNumeroEtudiant } from '../common/email-generator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  numeroEtudiant: true,
  classeId: true,
  etablissementId: true,
  actif: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueEmail(prenom: string, nom: string, role: Role) {
    const base = buildBaseEmail(prenom, nom, role);
    const [localPart, domain] = base.split('@');
    let email = base;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { email } })) {
      counter++;
      email = `${localPart}${counter}@${domain}`;
    }

    return email;
  }

  async create(dto: CreateUserDto, currentUser: JwtPayload) {
    if (dto.classeId) {
      const classe = await this.prisma.classe.findUnique({
        where: { id: dto.classeId },
      });
      if (!classe) {
        throw new BadRequestException(`Classe ${dto.classeId} introuvable`);
      }
    }

    const role = dto.role ?? Role.ETUDIANT;

    // Un admin crée toujours dans son propre établissement.
    // Le chef de projet doit préciser l'établissement (sauf pour créer un autre chef de projet).
    let etablissementId: number | null = null;
    if (role !== Role.CHEF_PROJET) {
      etablissementId =
        currentUser.role === Role.CHEF_PROJET
          ? dto.etablissementId ?? null
          : currentUser.etablissementId;

      if (!etablissementId) {
        throw new BadRequestException(
          "Un établissement est requis pour créer ce compte (etablissementId)",
        );
      }
      const etablissement = await this.prisma.etablissement.findUnique({
        where: { id: etablissementId },
      });
      if (!etablissement) {
        throw new BadRequestException(`Établissement ${etablissementId} introuvable`);
      }
    }

    const email = await this.generateUniqueEmail(dto.prenom, dto.nom, role);
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email,
        password: hashedPassword,
        role,
        classeId: dto.classeId,
        etablissementId,
      },
    });

    if (role === Role.ETUDIANT) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { numeroEtudiant: formatNumeroEtudiant(user.id) },
        select: userSelect,
      });
    }

    return this.prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
  }

  findAll(currentUser: JwtPayload) {
    const where: Prisma.UserWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    return this.prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.classeId) {
      const classe = await this.prisma.classe.findUnique({
        where: { id: dto.classeId },
      });
      if (!classe) {
        throw new BadRequestException(`Classe ${dto.classeId} introuvable`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(dto.nouveauMotDePasse, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async toggleActif(id: number) {
    const cible = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { actif: !cible.actif },
      select: userSelect,
    });
  }

  async removeForce(id: number) {
    await this.findOne(id);

    // Enseignements du prof + tout ce qui en dépend
    const enseignements = await this.prisma.enseignement.findMany({
      where: { professeurId: id },
      select: { id: true },
    });
    const enseignementIds = enseignements.map((e) => e.id);

    if (enseignementIds.length) {
      await this.prisma.note.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.absence.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.cahierTexte.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.epreuve.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.creneau.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
      await this.prisma.observation.deleteMany({ where: { enseignementId: { in: enseignementIds } } });
    }

    // Notes/absences/observations/punitions de l'élève, ou rédigées par lui
    await this.prisma.note.deleteMany({ where: { etudiantId: id } });
    await this.prisma.absence.deleteMany({ where: { etudiantId: id } });
    await this.prisma.observation.deleteMany({ where: { OR: [{ etudiantId: id }, { auteurId: id }] } });
    await this.prisma.punition.deleteMany({ where: { OR: [{ etudiantId: id }, { auteurId: id }] } });
    await this.prisma.inscriptionMatiere.deleteMany({ where: { etudiantId: id } });

    await this.prisma.enseignement.deleteMany({ where: { professeurId: id } });

    // Messagerie
    await this.prisma.message.deleteMany({ where: { OR: [{ expediteurId: id }, { destinataireId: id }] } });
    await this.prisma.messageGroupe.deleteMany({ where: { auteurId: id } });

    // Réunions organisées ou invitations reçues
    await this.prisma.invitationReunion.deleteMany({ where: { inviteId: id } });
    const reunionsOrganisees = await this.prisma.reunion.findMany({
      where: { organisateurId: id },
      select: { id: true },
    });
    const reunionIds = reunionsOrganisees.map((r) => r.id);
    if (reunionIds.length) {
      await this.prisma.invitationReunion.deleteMany({ where: { reunionId: { in: reunionIds } } });
      await this.prisma.reunion.deleteMany({ where: { id: { in: reunionIds } } });
    }

    // Frais scolaires
    const frais = await this.prisma.fraisScolarite.findUnique({ where: { etudiantId: id } });
    if (frais) {
      await this.prisma.versement.deleteMany({ where: { fraisId: frais.id } });
      await this.prisma.fraisScolarite.delete({ where: { id: frais.id } });
    }

    await this.prisma.inscriptionAdministrative.deleteMany({ where: { etudiantId: id } });
    await this.prisma.mentionBulletin.deleteMany({ where: { etudiantId: id } });
    await this.prisma.demandeSuppressionAdmin.deleteMany({
      where: { OR: [{ cibleId: id }, { demandeurId: id }, { traiteParId: id }] },
    });

    // Rendez-vous parents-profs
    await this.prisma.reservationRdv.deleteMany({ where: { OR: [{ parentId: id }, { etudiantId: id }] } });
    const creneauxRdv = await this.prisma.creneauRendezVous.findMany({
      where: { professeurId: id },
      select: { id: true },
    });
    const creneauxRdvIds = creneauxRdv.map((c) => c.id);
    if (creneauxRdvIds.length) {
      await this.prisma.reservationRdv.deleteMany({ where: { creneauId: { in: creneauxRdvIds } } });
      await this.prisma.creneauRendezVous.deleteMany({ where: { id: { in: creneauxRdvIds } } });
    }

    // Actualités et sondages
    await this.prisma.actualite.deleteMany({ where: { auteurId: id } });
    await this.prisma.voteSondage.deleteMany({ where: { votantId: id } });
    const sondages = await this.prisma.sondage.findMany({
      where: { auteurId: id },
      select: { id: true },
    });
    const sondageIds = sondages.map((s) => s.id);
    if (sondageIds.length) {
      await this.prisma.voteSondage.deleteMany({ where: { sondageId: { in: sondageIds } } });
      await this.prisma.optionSondage.deleteMany({ where: { sondageId: { in: sondageIds } } });
      await this.prisma.sondage.deleteMany({ where: { id: { in: sondageIds } } });
    }

    return this.prisma.user.delete({ where: { id }, select: userSelect });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const cible = await this.findOne(id);

    if (cible.role === Role.ADMIN && currentUser.role !== Role.CHEF_PROJET) {
      const demande = await this.prisma.demandeSuppressionAdmin.create({
        data: { cibleId: id, demandeurId: currentUser.sub },
      });

      const chefs = await this.prisma.user.findMany({
        where: { role: Role.CHEF_PROJET },
      });

      await Promise.all(
        chefs.map((chef) =>
          this.prisma.message.create({
            data: {
              contenu: `Demande de suppression du compte admin ${cible.prenom} ${cible.nom} (${cible.email}), demandée par le user #${currentUser.sub}. Rends-toi dans « Demandes de suppression » pour valider ou refuser.`,
              expediteurId: currentUser.sub,
              destinataireId: chef.id,
            },
          }),
        ),
      );

      return {
        enAttente: true,
        message:
          'La suppression de ce compte admin nécessite la validation du chef de projet. Une demande lui a été envoyée.',
        demandeId: demande.id,
      };
    }

    try {
      return await this.prisma.user.delete({ where: { id }, select: userSelect });
    } catch (err) {
      throw new BadRequestException(
        "Impossible de supprimer ce compte : il a de l'historique associé (notes, absences, enseignements, messages…). Utilise plutôt « Désactiver » pour bloquer son accès tout en conservant l'historique.",
      );
    }
  }
}
