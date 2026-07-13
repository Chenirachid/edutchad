import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

type MatiereMoyenne = {
  matiereId: number;
  nom: string;
  coefficient: number;
  moyenne: number | null;
};

@Injectable()
export class BulletinsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBulletinEtudiant(etudiantId: number, currentUser: JwtPayload) {
    const etudiant = await this.prisma.user.findUnique({
      where: { id: etudiantId },
      select: { id: true, nom: true, prenom: true, classeId: true },
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

    return this.computeBulletin(etudiant);
  }

  async getBulletinClasse(classeId: number, currentUser: JwtPayload) {
    if (currentUser.role === Role.ETUDIANT || currentUser.role === Role.PARENT) {
      throw new ForbiddenException(
        "Vous n'avez pas accès au bulletin de toute la classe",
      );
    }

    const classe = await this.prisma.classe.findUnique({
      where: { id: classeId },
      include: {
        etudiants: { select: { id: true, nom: true, prenom: true, classeId: true } },
      },
    });

    if (!classe) {
      throw new NotFoundException(`Classe ${classeId} introuvable`);
    }

    if (currentUser.role === Role.PROFESSEUR) {
      await this.assertProfesseurEnseigneA(classeId, currentUser.sub);
    }

    const bulletins = await Promise.all(
      classe.etudiants.map((etudiant) => this.computeBulletin(etudiant)),
    );

    return {
      classe: { id: classe.id, nom: classe.nom, anneeScolaire: classe.anneeScolaire },
      bulletins,
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

  private async computeBulletin(etudiant: {
    id: number;
    nom: string;
    prenom: string;
  }) {
    const notes = await this.prisma.note.findMany({
      where: { etudiantId: etudiant.id },
      include: { enseignement: { include: { matiere: true } } },
    });

    const parMatiere = new Map<
      number,
      { nom: string; coefficient: number; sommePonderee: number; sommeCoef: number }
    >();

    for (const note of notes) {
      const matiere = note.enseignement.matiere;
      const entry = parMatiere.get(matiere.id) ?? {
        nom: matiere.nom,
        coefficient: matiere.coefficient,
        sommePonderee: 0,
        sommeCoef: 0,
      };
      entry.sommePonderee += note.valeur * note.coefficient;
      entry.sommeCoef += note.coefficient;
      parMatiere.set(matiere.id, entry);
    }

    const matieres: MatiereMoyenne[] = Array.from(parMatiere.entries()).map(
      ([matiereId, e]) => ({
        matiereId,
        nom: e.nom,
        coefficient: e.coefficient,
        moyenne: e.sommeCoef > 0 ? arrondi(e.sommePonderee / e.sommeCoef) : null,
      }),
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

    return {
      etudiant: { id: etudiant.id, nom: etudiant.nom, prenom: etudiant.prenom },
      matieres,
      moyenneGenerale:
        sommeCoefGenerale > 0 ? arrondi(sommeGenerale / sommeCoefGenerale) : null,
    };
  }
}

function arrondi(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}
