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
import { buildBaseEmail, buildBaseIdentifiant, formatNumeroEtudiant, genererCodeActivation } from '../common/email-generator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  identifiant: true,
  role: true,
  numeroEtudiant: true,
  classeId: true,
  etablissementId: true,
  actif: true,
  derniereActivite: true,
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

  private async generateUniqueIdentifiant(prenom: string, nom: string) {
    const base = buildBaseIdentifiant(prenom, nom);
    let identifiant = base;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { identifiant } })) {
      counter++;
      identifiant = `${base}${counter}`;
    }

    return identifiant;
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
    // - CHEF_ETABLISSEMENT ne crée que des comptes admin de son établissement
    // - ADMIN crée tout le reste (profs, élèves, parents, vie scolaire), pas d'autres admins
    if (currentUser.role === Role.CHEF_PROJET) {
      if (role !== Role.CHEF_ETABLISSEMENT) {
        throw new ForbiddenException(
          "Le chef de projet ne peut créer que des comptes chef d'établissement. Demande au chef d'établissement concerné de créer les autres comptes.",
        );
      }
    } else if (currentUser.role === Role.CHEF_ETABLISSEMENT) {
      if (role !== Role.ADMIN) {
        throw new ForbiddenException(
          "Le chef d'établissement ne peut créer que des comptes admin. Demande à un admin de créer les comptes profs, élèves, parents ou vie scolaire.",
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
    const identifiant = await this.generateUniqueIdentifiant(dto.prenom, dto.nom);
    const codeActivation = genererCodeActivation();
    // Mot de passe temporaire inutilisable : la personne le remplace via l'activation
    const motDePasseTemporaire = await bcrypt.hash(genererCodeActivation() + genererCodeActivation(), SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email,
        identifiant,
        codeActivation,
        password: motDePasseTemporaire,
        role,
        classeId: dto.classeId,
        etablissementId,
      },
    });

    if (role === Role.ETUDIANT) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { numeroEtudiant: formatNumeroEtudiant(user.id) },
      });
    }

    const cree = await this.prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
    // Le code d'activation en clair n'est révélé qu'une seule fois, à la création
    return { ...cree, codeActivation };
  }

  findAll(currentUser: JwtPayload) {
    const where: Prisma.UserWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? { role: Role.CHEF_ETABLISSEMENT }
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

  async regenererActivation(id: number) {
    await this.findOne(id);
    const codeActivation = genererCodeActivation();
    const cible = await this.prisma.user.update({
      where: { id },
      data: { codeActivation },
      select: userSelect,
    });
    return { ...cible, codeActivation };
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
    return this.cascadeDeleteUser(id);
  }

  private async cascadeDeleteUser(id: number) {
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

    const dossier = await this.prisma.dossierProfesseur.findUnique({ where: { professeurId: id } });
    if (dossier) {
      await this.prisma.documentProfesseur.deleteMany({ where: { dossierId: dossier.id } });
      await this.prisma.dossierProfesseur.delete({ where: { id: dossier.id } });
    }
    await this.prisma.ressourceProf.deleteMany({ where: { professeurId: id } });

    return this.prisma.user.delete({ where: { id }, select: userSelect });
  }

  /**
   * Utilisé par le module Demandes de suppression une fois une demande approuvée :
   * nettoie tout l'historique lié avant de supprimer (établissement entier si c'est
   * un chef d'établissement, sinon juste le compte et ses données).
   */
  async supprimerCompteApprouve(cible: { id: number; role: Role; etablissementId: number | null }) {
    if (cible.role === Role.CHEF_ETABLISSEMENT && cible.etablissementId) {
      return this.removeEtablissementCascade(cible.etablissementId, cible.id);
    }
    return this.cascadeDeleteUser(cible.id);
  }

  /**
   * Suppression d'un chef d'établissement par le chef de projet : tout l'établissement
   * disparaît avec lui (tous ses comptes, classes, matières, etc.), comme fermer une école.
   */
  private async removeEtablissementCascade(etablissementId: number, chefId: number) {
    const utilisateurs = await this.prisma.user.findMany({
      where: { etablissementId },
      select: { id: true },
    });

    for (const u of utilisateurs) {
      if (u.id === chefId) continue;
      await this.cascadeDeleteUser(u.id);
    }
    await this.cascadeDeleteUser(chefId);

    // Filet de sécurité : enseignements restants de cet établissement
    await this.prisma.enseignement.deleteMany({ where: { classe: { etablissementId } } });
    await this.prisma.classe.deleteMany({ where: { etablissementId } });
    await this.prisma.matiere.deleteMany({ where: { etablissementId } });
    await this.prisma.parametrePlateforme.deleteMany({ where: { etablissementId } });
    await this.prisma.actualite.deleteMany({ where: { etablissementId } });

    const sondagesRestants = await this.prisma.sondage.findMany({
      where: { etablissementId },
      select: { id: true },
    });
    const sondageIdsRestants = sondagesRestants.map((s) => s.id);
    if (sondageIdsRestants.length) {
      await this.prisma.voteSondage.deleteMany({ where: { sondageId: { in: sondageIdsRestants } } });
      await this.prisma.optionSondage.deleteMany({ where: { sondageId: { in: sondageIdsRestants } } });
      await this.prisma.sondage.deleteMany({ where: { id: { in: sondageIdsRestants } } });
    }

    await this.prisma.groupe.deleteMany({ where: { etablissementId } });
    await this.prisma.etablissement.delete({ where: { id: etablissementId } });

    return {
      message: `Établissement fermé : ${utilisateurs.length} compte(s) supprimés définitivement avec toutes leurs données`,
      etablissementId,
    };
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
    // et dans ce cas TOUT l'établissement (comptes, classes, matières...) disparaît avec lui —
    // sinon une demande est envoyée au chef de projet.
    if (cible.role === Role.CHEF_ETABLISSEMENT) {
      if (currentUser.role !== Role.CHEF_PROJET) {
        const chefsProjet = await this.prisma.user.findMany({ where: { role: Role.CHEF_PROJET } });
        return this.creerDemandeSuppression(cible, currentUser, chefsProjet, "chef d'établissement");
      }

      if (!cible.etablissementId) {
        return this.prisma.user.delete({ where: { id }, select: userSelect });
      }
      return this.removeEtablissementCascade(cible.etablissementId, cible.id);
    }

    // Le chef de projet n'a le droit de supprimer que des comptes chef d'établissement —
    // rien d'autre, même en tentant l'API directement.
    if (currentUser.role === Role.CHEF_PROJET) {
      throw new ForbiddenException(
        "Le chef de projet ne peut supprimer que des comptes chef d'établissement.",
      );
    }

    // Toute suppression d'un compte "normal" (admin, prof, élève, parent, vie scolaire) par
    // un simple ADMIN doit être validée par le chef d'établissement de son établissement
    // (ou par le chef de projet si aucun chef d'établissement n'est encore désigné).
    if (currentUser.role === Role.ADMIN) {
      let destinataires = await this.prisma.user.findMany({
        where: { role: Role.CHEF_ETABLISSEMENT, etablissementId: cible.etablissementId },
      });
      if (!destinataires.length) {
        destinataires = await this.prisma.user.findMany({ where: { role: Role.CHEF_PROJET } });
      }
      return this.creerDemandeSuppression(cible, currentUser, destinataires, cible.role.toLowerCase());
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
