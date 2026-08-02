import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MentionsBulletinService } from '../mentions-bulletin/mentions-bulletin.service';
import { BulletinMatiereService } from '../bulletin-matiere/bulletin-matiere.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

type MatiereMoyenne = {
  matiereId: number;
  nom: string;
  coefficient: number;
  professeur: string | null;
  moyenne: number | null;
  moyenneDevoirs: number | null;
  moyenneCompositions: number | null;
  enseignementId?: number;
  elementsProgramme?: string | null;
  appreciationTravail?: string | null;
  appreciationAvis?: string | null;
};

@Injectable()
export class BulletinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mentionsBulletinService: MentionsBulletinService,
    private readonly bulletinMatiereService: BulletinMatiereService,
  ) {}

  async getBulletinEtudiant(etudiantId: number, currentUser: JwtPayload, trimestre?: number) {
    const etudiant = await this.prisma.user.findUnique({
      where: { id: etudiantId },
      select: { id: true, nom: true, prenom: true, numeroEtudiant: true, classeId: true, etablissementId: true },
    });

    if (!etudiant) {
      throw new NotFoundException(`Étudiant ${etudiantId} introuvable`);
    }

    if (currentUser.role === Role.ETUDIANT && currentUser.sub !== etudiantId) {
      throw new ForbiddenException("Vous ne pouvez consulter que votre propre bulletin");
    }

    if (currentUser.role === Role.PROFESSEUR) {
      await this.assertProfesseurEnseigneA(etudiant.classeId, currentUser.sub);
    }

    if (currentUser.role === Role.PARENT) {
      await this.assertParentDe(etudiantId, currentUser.sub);
    }

    const respecterPublication = currentUser.role === Role.ETUDIANT || currentUser.role === Role.PARENT;
    const bulletin: any = await this.computeBulletin(etudiant, respecterPublication, trimestre);

    if (etudiant.classeId) {
      const { rang, total } = await this.computerRangDansClasse(
        etudiant.classeId,
        etudiant.id,
        respecterPublication,
        trimestre,
      );
      bulletin.rang = rang;
      bulletin.totalClasse = total;
    }
    bulletin.absencesRetards = await this.compterAbsencesRetards(etudiant.id, trimestre);

    return bulletin;
  }

  async getBulletinClasse(classeId: number, currentUser: JwtPayload, trimestre?: number) {
    if (currentUser.role === Role.ETUDIANT || currentUser.role === Role.PARENT) {
      throw new ForbiddenException(
        "Vous n'avez pas accès au bulletin de toute la classe",
      );
    }

    const classe = await this.prisma.classe.findUnique({
      where: { id: classeId },
      include: {
        etudiants: { select: { id: true, nom: true, prenom: true, numeroEtudiant: true, classeId: true, etablissementId: true } },
      },
    });

    if (!classe) {
      throw new NotFoundException(`Classe ${classeId} introuvable`);
    }

    if (currentUser.role === Role.PROFESSEUR) {
      await this.assertProfesseurEnseigneA(classeId, currentUser.sub);
    }

    const bulletins: any[] = await Promise.all(
      classe.etudiants.map((etudiant) => this.computeBulletin(etudiant, false, trimestre)),
    );

    // Classement : tri décroissant par moyenne générale (les non-notés en dernier).
    const ordonnes = bulletins
      .slice()
      .sort((x, y) => (y.moyenneGenerale ?? -1) - (x.moyenneGenerale ?? -1));
    bulletins.forEach((b) => {
      const position = ordonnes.findIndex((o) => o.etudiant.id === b.etudiant.id);
      b.rang = b.moyenneGenerale !== null ? position + 1 : null;
      b.totalClasse = bulletins.length;
    });

    for (const b of bulletins) {
      b.absencesRetards = await this.compterAbsencesRetards(b.etudiant.id, trimestre);
    }

    return {
      classe: { id: classe.id, nom: classe.nom, anneeScolaire: classe.anneeScolaire },
      bulletins,
    };
  }

  async getMoyennesClasse(classeId: number, currentUser: JwtPayload) {
    if (currentUser.role === Role.ETUDIANT) {
      const moi = await this.prisma.user.findUnique({ where: { id: currentUser.sub } });
      if (!moi || moi.classeId !== classeId) {
        throw new ForbiddenException("Vous ne pouvez consulter que la moyenne de votre propre classe");
      }
    }
    if (currentUser.role === Role.PARENT) {
      const enfant = await this.prisma.user.findFirst({
        where: { classeId, parents: { some: { id: currentUser.sub } } },
      });
      if (!enfant) {
        throw new ForbiddenException("Aucun de vos enfants n'appartient à cette classe");
      }
    }

    const classe = await this.prisma.classe.findUnique({
      where: { id: classeId },
      include: {
        etudiants: { select: { id: true, nom: true, prenom: true, numeroEtudiant: true, classeId: true, etablissementId: true } },
      },
    });
    if (!classe) {
      throw new NotFoundException(`Classe ${classeId} introuvable`);
    }

    const bulletins = await Promise.all(
      classe.etudiants.map((etudiant) => this.computeBulletin(etudiant, true)),
    );

    const parMatiere = new Map<number, { nom: string; valeurs: number[] }>();
    for (const b of bulletins) {
      for (const m of b.matieres) {
        if (m.moyenne === null) continue;
        const entry = parMatiere.get(m.matiereId) ?? { nom: m.nom, valeurs: [] };
        entry.valeurs.push(m.moyenne);
        parMatiere.set(m.matiereId, entry);
      }
    }

    const moyennesParMatiere = Array.from(parMatiere.entries()).map(([matiereId, e]) => ({
      matiereId,
      nom: e.nom,
      moyenneClasse: arrondi(e.valeurs.reduce((a, v) => a + v, 0) / e.valeurs.length),
    }));

    return { classeId, moyennesParMatiere };
  }

  private async computerRangDansClasse(
    classeId: number,
    etudiantId: number,
    respecterPublication: boolean,
    trimestre?: number,
  ) {
    const classe = await this.prisma.classe.findUnique({
      where: { id: classeId },
      include: {
        etudiants: { select: { id: true, nom: true, prenom: true, numeroEtudiant: true, classeId: true, etablissementId: true } },
      },
    });
    if (!classe) return { rang: null, total: 0 };

    const bulletins = await Promise.all(
      classe.etudiants.map((e) => this.computeBulletin(e, respecterPublication, trimestre)),
    );
    const ordonnes = bulletins
      .slice()
      .sort((x, y) => (y.moyenneGenerale ?? -1) - (x.moyenneGenerale ?? -1));
    const moi = bulletins.find((b) => b.etudiant.id === etudiantId);
    if (!moi || moi.moyenneGenerale === null) return { rang: null, total: bulletins.length };
    const position = ordonnes.findIndex((b) => b.etudiant.id === etudiantId);
    return { rang: position + 1, total: bulletins.length };
  }

  private async compterAbsencesRetards(etudiantId: number, trimestre?: number) {
    const etudiant = await this.prisma.user.findUnique({ where: { id: etudiantId } });
    const parametres = await this.prisma.parametrePlateforme.findFirst({
      where: { etablissementId: etudiant?.etablissementId ?? null },
    });
    const periodeDe = (date: Date): number => {
      if (parametres?.debutTrimestre3 && date >= parametres.debutTrimestre3) return 3;
      if (parametres?.debutTrimestre2 && date >= parametres.debutTrimestre2) return 2;
      return 1;
    };

    const absences = await this.prisma.absence.findMany({ where: { etudiantId } });
    const filtrees = trimestre
      ? absences.filter((a) => periodeDe(a.date) === trimestre)
      : absences;

    return {
      absences: filtrees.filter((a) => a.type === 'ABSENCE').length,
      retards: filtrees.filter((a) => a.type === 'RETARD').length,
    };
  }

  private async assertParentDe(enfantId: number, parentId: number) {
    const lien = await this.prisma.user.findFirst({
      where: { id: enfantId, parents: { some: { id: parentId } } },
    });

    if (!lien) {
      throw new ForbiddenException("Cet étudiant n'est pas lié à votre compte");
    }
  }

  private async assertProfesseurEnseigneA(
    classeId: number | null,
    professeurId: number,
  ) {
    if (!classeId) {
      throw new ForbiddenException("Cet étudiant n'appartient à aucune classe");
    }

    const enseigne = await this.prisma.enseignement.findFirst({
      where: { classeId, professeurId },
    });

    if (!enseigne) {
      throw new ForbiddenException(
        "Vous n'enseignez pas dans la classe de cet étudiant",
      );
    }
  }

  private async computeBulletin(
    etudiant: {
      id: number;
      nom: string;
      prenom: string;
      numeroEtudiant?: string | null;
      etablissementId?: number | null;
      classeId?: number | null;
    },
    respecterPublication = false,
    trimestre?: number,
  ) {
    const parametres = await this.prisma.parametrePlateforme.findFirst({
      where: { etablissementId: etudiant.etablissementId ?? null },
    });

    const notesBrutes = await this.prisma.note.findMany({
      where: {
        etudiantId: etudiant.id,
        ...(respecterPublication
          ? { OR: [{ epreuveId: null }, { epreuve: { datePublication: { lte: new Date() } } }] }
          : {}),
      },
      include: {
        enseignement: { include: { matiere: true, professeur: { select: { nom: true, prenom: true } } } },
        epreuve: true,
      },
    });

    const dateDeReference = (note: (typeof notesBrutes)[number]) =>
      note.epreuve?.date ?? note.createdAt;

    const periodeDe = (date: Date): number => {
      if (parametres?.debutTrimestre3 && date >= parametres.debutTrimestre3) return 3;
      if (parametres?.debutTrimestre2 && date >= parametres.debutTrimestre2) return 2;
      return 1;
    };

    const notes = trimestre
      ? notesBrutes.filter((n) => periodeDe(dateDeReference(n)) === trimestre)
      : notesBrutes;

    const parMatiere = new Map<
      number,
      {
        nom: string;
        coefficient: number;
        sommePonderee: number;
        sommeCoef: number;
        sommeDevoirs: number;
        coefDevoirs: number;
        sommeCompositions: number;
        coefCompositions: number;
        professeur: string | null;
        enseignementId: number;
      }
    >();

    for (const note of notes) {
      const matiere = note.enseignement.matiere;
      const entry = parMatiere.get(matiere.id) ?? {
        nom: matiere.nom,
        coefficient: matiere.coefficient,
        sommePonderee: 0,
        sommeCoef: 0,
        sommeDevoirs: 0,
        coefDevoirs: 0,
        sommeCompositions: 0,
        coefCompositions: 0,
        professeur: note.enseignement.professeur
          ? `${note.enseignement.professeur.prenom} ${note.enseignement.professeur.nom}`
          : null,
        enseignementId: note.enseignementId,
      };
      entry.sommePonderee += note.valeur * note.coefficient;
      entry.sommeCoef += note.coefficient;
      // M.DEV = devoirs et contrôles ; M.COMP = examens (compositions)
      if (note.type === 'EXAMEN') {
        entry.sommeCompositions += note.valeur * note.coefficient;
        entry.coefCompositions += note.coefficient;
      } else {
        entry.sommeDevoirs += note.valeur * note.coefficient;
        entry.coefDevoirs += note.coefficient;
      }
      parMatiere.set(matiere.id, entry);
    }

    const bulletinMatieres = trimestre
      ? await this.bulletinMatiereService.findPourEtudiantEtTrimestre(etudiant.id, trimestre)
      : [];
    const parEnseignement = new Map(bulletinMatieres.map((bm) => [bm.enseignementId, bm]));

    const matieres: MatiereMoyenne[] = Array.from(parMatiere.entries()).map(
      ([matiereId, e]) => {
        const bm = parEnseignement.get(e.enseignementId);
        return {
          matiereId,
          nom: e.nom,
          coefficient: e.coefficient,
          professeur: e.professeur,
          moyenne: e.sommeCoef > 0 ? arrondi(e.sommePonderee / e.sommeCoef) : null,
          moyenneDevoirs: e.coefDevoirs > 0 ? arrondi(e.sommeDevoirs / e.coefDevoirs) : null,
          moyenneCompositions: e.coefCompositions > 0 ? arrondi(e.sommeCompositions / e.coefCompositions) : null,
          enseignementId: e.enseignementId,
          elementsProgramme: bm?.elementsProgramme ?? null,
          appreciationTravail: bm?.appreciationTravail ?? null,
          appreciationAvis: bm?.appreciationAvis ?? null,
        };
      },
    );

    const matieresNotees = matieres.filter(
      (m): m is MatiereMoyenne & { moyenne: number } => m.moyenne !== null,
    );
    const sommeCoefGenerale = matieresNotees.reduce(
      (acc, m) => acc + m.coefficient,
      0,
    );
    const sommeGenerale = matieresNotees.reduce(
      (acc, m) => acc + m.moyenne * m.coefficient,
      0,
    );

    const anneeScolaire = parametres?.anneeScolaire ?? '2025-2026';
    const mentionEntry = await this.mentionsBulletinService.getPourEtudiant(
      etudiant.id,
      anneeScolaire,
    );

    return {
      etudiant: {
        id: etudiant.id,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        numeroEtudiant: etudiant.numeroEtudiant ?? null,
        classeId: etudiant.classeId ?? null,
      },
      matieres,
      moyenneGenerale:
        sommeCoefGenerale > 0 ? arrondi(sommeGenerale / sommeCoefGenerale) : null,
      mention: mentionEntry?.mention ?? 'EN_ATTENTE',
      appreciation: mentionEntry?.appreciation ?? null,
    };
  }
}

function arrondi(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}
