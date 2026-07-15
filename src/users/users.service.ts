import {
  BadRequestException,
  ForbiddenException,
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

    // Hiérarchie de création des comptes, comme dans Pronote :
    // - CHEF_PROJET ne crée que des chefs d'établissement (un par établissement)
    // - CHEF_ETABLISSEMENT crée tout le reste de son établissement, y compris les admins
    // - ADMIN crée tout sauf des comptes admin/chef d'établissement/chef de projet
    if (currentUser.role === Role.CHEF_PROJET) {
      if (role !== Role.CHEF_ETABLISSEMENT) {
        throw new ForbiddenException(
          "Le chef de projet ne peut créer que des comptes chef d'établissement. Demande au chef d'établissement concerné de créer les autres comptes.",
        );
      }
    } else if (currentUser.role === Role.CHEF_ETABLISSEMENT) {
      if (role === Role.CHEF_PROJET || role === Role.CHEF_ETABLISSEMENT) {
        throw new ForbiddenException(
          "Tu ne peux pas créer de compte chef de projet ou chef d'établissement.",
        );
      }
    } else if (currentUser.role === Role.ADMIN) {
      if (
        role === Role.CHEF_PROJET ||
        role === Role.CHEF_ETABLISSEMENT ||
        role === Role.ADMIN
      ) {
        throw new ForbiddenException(
          "Un administrateur ne peut pas créer de compte admin, chef d'établissement ou chef de projet — demande au chef d'établissement.",
        );
      }
    }

    // Établissement : le chef de projet doit préciser lequel (il n'en a pas lui-même) ;
    // tous les autres créent toujours dans leur propre établissement.
    const etablissementId =
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

  private async creerDemandeSuppression(
    cible: { id: number; prenom: string; nom: string; email: string },
    currentUser: JwtPayload,
    destinataires: { id: number }[],
    libelleRole: string,
  ) {
    const demande = await this.prisma.demandeSuppressionAdmin.create({
      data: { cibleId: cible.id, demandeurId: currentUser.sub },
    });

    await Promise.all(
      destinataires.map((dest) =>
        this.prisma.message.create({
          data: {
            contenu: `Demande de suppression du compte ${libelleRole} ${cible.prenom} ${cible.nom} (${cible.email}), demandée par le user #${currentUser.sub}. Rends-toi dans « Demandes de suppression » pour valider ou refuser.`,
            expediteurId: currentUser.sub,
            destinataireId: dest.id,
          },
        }),
      ),
    );

    return {
      enAttente: true,
      message: `La suppression de ce compte ${libelleRole} nécessite une validation. Une demande a été envoyée.`,
      demandeId: demande.id,
    };
  }

  async remove(id: number, currentUser: JwtPayload) {
    const cible = await this.findOne(id);

    // Suppression d'un chef d'établissement : seul le chef de projet peut le faire directement,
    // sinon une demande lui est envoyée.
    if (cible.role === Role.CHEF_ETABLISSEMENT && currentUser.role !== Role.CHEF_PROJET) {
      const chefsProjet = await this.prisma.user.findMany({ where: { role: Role.CHEF_PROJET } });
      return this.creerDemandeSuppression(cible, currentUser, chefsProjet, "chef d'établissement");
    }

    // Suppression d'un compte admin par un autre admin (pas par le chef d'établissement/projet) :
    // la demande remonte au chef d'établissement de ce même établissement (ou au chef de projet
    // si l'établissement n'a pas encore de chef d'établissement désigné).
    if (cible.role === Role.ADMIN && currentUser.role === Role.ADMIN) {
      let destinataires = await this.prisma.user.findMany({
        where: { role: Role.CHEF_ETABLISSEMENT, etablissementId: cible.etablissementId },
      });
      if (!destinataires.length) {
        destinataires = await this.prisma.user.findMany({ where: { role: Role.CHEF_PROJET } });
      }
      return this.creerDemandeSuppression(cible, currentUser, destinataires, 'admin');
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
