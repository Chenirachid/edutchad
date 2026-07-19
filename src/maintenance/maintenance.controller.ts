import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-nettoyage-2026';
const NOM_A_GARDER = 'Lycée Exemple';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly prisma: PrismaService) {}

  private async cascadeDeleteUser(id: number) {
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

    await this.prisma.note.deleteMany({ where: { etudiantId: id } });
    await this.prisma.absence.deleteMany({ where: { etudiantId: id } });
    await this.prisma.observation.deleteMany({ where: { OR: [{ etudiantId: id }, { auteurId: id }] } });
    await this.prisma.punition.deleteMany({ where: { OR: [{ etudiantId: id }, { auteurId: id }] } });
    await this.prisma.inscriptionMatiere.deleteMany({ where: { etudiantId: id } });
    await this.prisma.enseignement.deleteMany({ where: { professeurId: id } });

    await this.prisma.message.deleteMany({ where: { OR: [{ expediteurId: id }, { destinataireId: id }] } });
    await this.prisma.messageGroupe.deleteMany({ where: { auteurId: id } });

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

    await this.prisma.reservationRdv.deleteMany({ where: { OR: [{ parentId: id }, { etudiantId: id }] } });
    const creneauxRdv = await this.prisma.creneauRendezVous.findMany({
      where: { organisateurId: id },
      select: { id: true },
    });
    const creneauxRdvIds = creneauxRdv.map((c) => c.id);
    if (creneauxRdvIds.length) {
      await this.prisma.reservationRdv.deleteMany({ where: { creneauId: { in: creneauxRdvIds } } });
      await this.prisma.creneauRendezVous.deleteMany({ where: { id: { in: creneauxRdvIds } } });
    }

    await this.prisma.actualite.deleteMany({ where: { auteurId: id } });
    await this.prisma.voteSondage.deleteMany({ where: { votantId: id } });
    const sondages = await this.prisma.sondage.findMany({ where: { auteurId: id }, select: { id: true } });
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

    return this.prisma.user.delete({ where: { id } });
  }

  @Get('nettoyer-etablissements')
  async nettoyerEtablissements(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const aGarder = await this.prisma.etablissement.findFirst({ where: { nom: NOM_A_GARDER } });
    const aSupprimer = await this.prisma.etablissement.findMany({
      where: aGarder ? { id: { not: aGarder.id } } : {},
    });

    const resultats: { etablissement: string; comptesSupprimes: number }[] = [];

    for (const etab of aSupprimer) {
      const utilisateurs = await this.prisma.user.findMany({
        where: { etablissementId: etab.id },
        select: { id: true },
      });

      for (const u of utilisateurs) {
        await this.cascadeDeleteUser(u.id);
      }

      await this.prisma.enseignement.deleteMany({ where: { classe: { etablissementId: etab.id } } });
      await this.prisma.classe.deleteMany({ where: { etablissementId: etab.id } });
      await this.prisma.matiere.deleteMany({ where: { etablissementId: etab.id } });
      await this.prisma.parametrePlateforme.deleteMany({ where: { etablissementId: etab.id } });
      await this.prisma.actualite.deleteMany({ where: { etablissementId: etab.id } });

      const sondagesRestants = await this.prisma.sondage.findMany({
        where: { etablissementId: etab.id },
        select: { id: true },
      });
      const sondageIdsRestants = sondagesRestants.map((s) => s.id);
      if (sondageIdsRestants.length) {
        await this.prisma.voteSondage.deleteMany({ where: { sondageId: { in: sondageIdsRestants } } });
        await this.prisma.optionSondage.deleteMany({ where: { sondageId: { in: sondageIdsRestants } } });
        await this.prisma.sondage.deleteMany({ where: { id: { in: sondageIdsRestants } } });
      }

      await this.prisma.groupe.deleteMany({ where: { etablissementId: etab.id } });
      await this.prisma.etablissement.delete({ where: { id: etab.id } });

      resultats.push({ etablissement: etab.nom, comptesSupprimes: utilisateurs.length });
    }

    return {
      message: `${aSupprimer.length} établissement(s) supprimé(s), "${NOM_A_GARDER}" conservé`,
      details: resultats,
    };
  }
}
