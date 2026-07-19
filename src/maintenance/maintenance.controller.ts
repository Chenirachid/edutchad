import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { Role, TypeEvaluation, JourSemaine } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-seed-riche-2026';
const SALT_ROUNDS = 10;

function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function slugify(s: string): string {
  return normaliser(s.replace(/\s+/g, '-')).replace(/[^a-z-]/g, '') || 'etablissement';
}

function genererCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly prisma: PrismaService) {}

  private async identifiantUnique(prenom: string, nom: string) {
    const base = `${normaliser(prenom)}.${normaliser(nom)}`;
    let identifiant = base;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { identifiant } })) {
      counter++;
      identifiant = `${base}${counter}`;
    }
    return identifiant;
  }

  private async creerCompte(
    prenom: string,
    nom: string,
    role: Role,
    etablissementId: number,
    classeId?: number,
  ) {
    const identifiant = await this.identifiantUnique(prenom, nom);
    const codeActivation = genererCode();
    const motDePasseTemp = await bcrypt.hash(genererCode() + genererCode(), SALT_ROUNDS);
    const email = `${identifiant}@exemple.local`;

    const user = await this.prisma.user.create({
      data: {
        prenom,
        nom,
        identifiant,
        email,
        codeActivation,
        password: motDePasseTemp,
        role,
        etablissementId,
        classeId,
      },
    });

    if (role === Role.ETUDIANT) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { numeroEtudiant: `ETU-${String(user.id).padStart(5, '0')}` },
      });
    }

    return { id: user.id, prenom, nom, role, identifiant, codeActivation };
  }

  @Get('seed-etablissement-riche')
  async seedEtablissementRiche(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const nomEtab = 'Dossier scientifique de la Renaissance';
    const base = slugify(nomEtab);
    let code = base;
    let i = 1;
    while (await this.prisma.etablissement.findUnique({ where: { code } })) {
      i++;
      code = `${base}-${i}`;
    }

    const etablissement = await this.prisma.etablissement.create({ data: { nom: nomEtab, code } });
    await this.prisma.parametrePlateforme.create({
      data: { nomEtablissement: nomEtab, etablissementId: etablissement.id },
    });

    // Classes
    const classesNoms = ['Seconde A', 'Première S', 'Terminale S'];
    const classes: Record<string, number> = {};
    for (const nom of classesNoms) {
      const c = await this.prisma.classe.create({
        data: { nom, anneeScolaire: '2025-2026', etablissementId: etablissement.id },
      });
      classes[nom] = c.id;
    }

    // Matières
    const matieresDef: [string, number][] = [
      ['Mathématiques', 4],
      ['Physique-Chimie', 3],
      ['SVT', 2],
      ['Français', 3],
      ['Anglais', 2],
    ];
    const matieres: Record<string, number> = {};
    for (const [nom, coefficient] of matieresDef) {
      const m = await this.prisma.matiere.create({
        data: { nom, coefficient, etablissementId: etablissement.id },
      });
      matieres[nom] = m.id;
    }

    const comptes: any[] = [];

    // Administrateurs
    const admin1 = await this.creerCompte('Camille', 'Duterte', Role.ADMIN, etablissement.id);
    const admin2 = await this.creerCompte('Antoine', 'Vidal', Role.ADMIN, etablissement.id);
    comptes.push({ titre: 'Admin', ...admin1 }, { titre: 'Admin', ...admin2 });

    // Professeurs (un par matière)
    const profsDef: [string, string, string][] = [
      ['Karim', 'Delacroix', 'Mathématiques'],
      ['Sophie', 'Renard', 'Physique-Chimie'],
      ['Julien', 'Faucher', 'SVT'],
      ['Amélie', 'Rostand', 'Français'],
      ['Thomas', 'Vasseur', 'Anglais'],
    ];
    const profs: Record<string, number> = {};
    for (const [prenom, nom, matiereNom] of profsDef) {
      const p = await this.creerCompte(prenom, nom, Role.PROFESSEUR, etablissement.id);
      profs[matiereNom] = p.id;
      comptes.push({ titre: `Professeur (${matiereNom})`, ...p });
    }

    // Enseignements : chaque classe a les 5 matières, chacune avec son prof dédié
    const enseignements: Record<string, number> = {};
    for (const classeNom of classesNoms) {
      for (const [, , matiereNom] of profsDef) {
        const e = await this.prisma.enseignement.create({
          data: {
            classeId: classes[classeNom],
            matiereId: matieres[matiereNom],
            professeurId: profs[matiereNom],
          },
        });
        enseignements[`${classeNom}|${matiereNom}`] = e.id;
      }
    }

    // Emploi du temps : 5 créneaux par classe, sans conflit de prof/classe
    const plagesHoraires: [string, string][] = [
      ['08:00', '09:00'],
      ['09:00', '10:00'],
      ['10:00', '11:00'],
      ['11:00', '12:00'],
      ['14:00', '15:00'],
    ];
    const jours: JourSemaine[] = [
      JourSemaine.LUNDI,
      JourSemaine.MARDI,
      JourSemaine.MERCREDI,
      JourSemaine.JEUDI,
      JourSemaine.VENDREDI,
    ];
    const matiereNoms = profsDef.map(([, , m]) => m);
    const salles = ['A1', 'A2', 'B1', 'B2', 'Labo'];

    for (let ci = 0; ci < classesNoms.length; ci++) {
      const classeNom = classesNoms[ci];
      for (let mi = 0; mi < matiereNoms.length; mi++) {
        // décalage circulaire pour éviter les conflits de prof entre les 3 classes
        const decalage = (mi + ci) % matiereNoms.length;
        const jour = jours[decalage % jours.length];
        const [heureDebut, heureFin] = plagesHoraires[decalage];
        await this.prisma.creneau.create({
          data: {
            enseignementId: enseignements[`${classeNom}|${matiereNoms[mi]}`],
            jour,
            heureDebut,
            heureFin,
            salle: salles[mi],
          },
        });
      }
    }

    // Élèves (3 par classe)
    const elevesDef: [string, string, string][] = [
      ['Lucas', 'Martin', 'Seconde A'],
      ['Chloé', 'Bernard', 'Seconde A'],
      ['Nathan', 'Petit', 'Seconde A'],
      ['Léa', 'Dubois', 'Première S'],
      ['Hugo', 'Moreau', 'Première S'],
      ['Manon', 'Girard', 'Première S'],
      ['Enzo', 'Lambert', 'Terminale S'],
      ['Camille', 'Fontaine', 'Terminale S'],
      ['Sarah', 'Leroy', 'Terminale S'],
    ];
    const eleves: { id: number; classeNom: string }[] = [];
    for (const [prenom, nom, classeNom] of elevesDef) {
      const e = await this.creerCompte(prenom, nom, Role.ETUDIANT, etablissement.id, classes[classeNom]);
      eleves.push({ id: e.id, classeNom });
      comptes.push({ titre: `Élève (${classeNom})`, ...e });
    }

    // Cahier de texte : une entrée par enseignement, avec devoirs déjà donnés
    const aujourdHui = new Date();
    for (const classeNom of classesNoms) {
      for (const matiereNom of matiereNoms) {
        await this.prisma.cahierTexte.create({
          data: {
            enseignementId: enseignements[`${classeNom}|${matiereNom}`],
            date: aujourdHui,
            contenu: `Cours sur les notions clés du chapitre en cours de ${matiereNom}.`,
            devoirs: `Exercices 1 à 5 à préparer pour la prochaine séance de ${matiereNom}.`,
          },
        });
      }
    }

    // Notes : une note par élève et par matière de sa classe
    const typesEval = [TypeEvaluation.CONTROLE, TypeEvaluation.DEVOIR, TypeEvaluation.EXAMEN];
    for (const eleve of eleves) {
      for (const matiereNom of matiereNoms) {
        const enseignementId = enseignements[`${eleve.classeNom}|${matiereNom}`];
        const valeur = Math.round((8 + Math.random() * 12) * 4) / 4; // entre 8 et 20
        await this.prisma.note.create({
          data: {
            etudiantId: eleve.id,
            enseignementId,
            valeur,
            coefficient: 1,
            type: typesEval[Math.floor(Math.random() * typesEval.length)],
            commentaire: valeur >= 14 ? 'Très bon travail.' : valeur >= 10 ? 'Correct, peut mieux faire.' : 'À retravailler.',
          },
        });
      }
    }

    // Réunions organisées par un admin, avec deux profs invités
    const dansTroisJours = new Date();
    dansTroisJours.setDate(dansTroisJours.getDate() + 3);
    dansTroisJours.setHours(14, 0, 0, 0);
    const reunion1 = await this.prisma.reunion.create({
      data: {
        sujet: 'Conseil de classe — Terminale S',
        lieu: 'Salle des professeurs',
        date: dansTroisJours,
        organisateurId: admin1.id,
        invitations: {
          create: [{ inviteId: profs['Mathématiques'] }, { inviteId: profs['Physique-Chimie'] }],
        },
      },
    });

    const dansUneSemaine = new Date();
    dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);
    dansUneSemaine.setHours(10, 0, 0, 0);
    const reunion2 = await this.prisma.reunion.create({
      data: {
        sujet: 'Réunion pédagogique — préparation du bulletin',
        lieu: 'Bureau de la direction',
        date: dansUneSemaine,
        organisateurId: admin2.id,
        invitations: {
          create: [{ inviteId: profs['Français'] }, { inviteId: profs['Anglais'] }, { inviteId: profs['SVT'] }],
        },
      },
    });

    return {
      message: `Établissement "${nomEtab}" créé avec profs, admins, emploi du temps, cahier de texte, notes et réunions`,
      etablissement: { id: etablissement.id, nom: nomEtab, code },
      classes: classesNoms,
      matieres: matieresDef.map(([n]) => n),
      resume: {
        comptes: comptes.length,
        enseignements: Object.keys(enseignements).length,
        creneaux: classesNoms.length * matiereNoms.length,
        cahierTexte: classesNoms.length * matiereNoms.length,
        notes: eleves.length * matiereNoms.length,
        reunions: 2,
      },
      comptes,
    };
  }
}
