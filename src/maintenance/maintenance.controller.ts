import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-recreation-2026';
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

  @Get('recreer-lycee-exemple')
  async recreerLyceeExemple(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const nomEtab = 'Lycée Exemple';
    const base = slugify(nomEtab);
    let code = base;
    let i = 1;
    while (await this.prisma.etablissement.findUnique({ where: { code } })) {
      i++;
      code = `${base}-${i}`;
    }

    const etablissement = await this.prisma.etablissement.create({
      data: { nom: nomEtab, code },
    });
    await this.prisma.parametrePlateforme.create({
      data: { nomEtablissement: nomEtab, etablissementId: etablissement.id },
    });

    const classesNoms = ['6ème A', '5ème B', 'Terminale S'];
    const classes: Record<string, number> = {};
    for (const nom of classesNoms) {
      const c = await this.prisma.classe.create({
        data: { nom, anneeScolaire: '2025-2026', etablissementId: etablissement.id },
      });
      classes[nom] = c.id;
    }

    const matieresDef: [string, number][] = [
      ['Mathématiques', 4],
      ['Français', 3],
      ['Histoire-Géographie', 2],
      ['Anglais', 2],
      ['SVT', 2],
    ];
    const matieres: Record<string, number> = {};
    for (const [nom, coefficient] of matieresDef) {
      const m = await this.prisma.matiere.create({
        data: { nom, coefficient, etablissementId: etablissement.id },
      });
      matieres[nom] = m.id;
    }

    const comptes: any[] = [];

    const admin = await this.creerCompte('Aïcha', 'Moussa', Role.ADMIN, etablissement.id);
    comptes.push({ titre: 'Admin', ...admin });

    const profsDef: [string, string][] = [
      ['Nadia', 'Boukar'],
      ['Ismael', 'Youssouf'],
      ['Fatimé', 'Abakar'],
      ['Moussa', 'Idriss'],
    ];
    const profs: Record<string, number> = {};
    for (const [prenom, nom] of profsDef) {
      const p = await this.creerCompte(prenom, nom, Role.PROFESSEUR, etablissement.id);
      profs[`${prenom} ${nom}`] = p.id;
      comptes.push({ titre: 'Professeur', ...p });
    }

    const enseignementsDef: [string, string, string][] = [
      ['6ème A', 'Mathématiques', 'Nadia Boukar'],
      ['6ème A', 'Français', 'Ismael Youssouf'],
      ['6ème A', 'Anglais', 'Moussa Idriss'],
      ['5ème B', 'Mathématiques', 'Nadia Boukar'],
      ['5ème B', 'Histoire-Géographie', 'Fatimé Abakar'],
      ['5ème B', 'SVT', 'Moussa Idriss'],
      ['Terminale S', 'Mathématiques', 'Nadia Boukar'],
      ['Terminale S', 'Français', 'Ismael Youssouf'],
      ['Terminale S', 'Histoire-Géographie', 'Fatimé Abakar'],
      ['Terminale S', 'Anglais', 'Moussa Idriss'],
      ['Terminale S', 'SVT', 'Moussa Idriss'],
    ];
    for (const [classeNom, matiereNom, profNom] of enseignementsDef) {
      await this.prisma.enseignement.create({
        data: {
          classeId: classes[classeNom],
          matiereId: matieres[matiereNom],
          professeurId: profs[profNom],
        },
      });
    }

    const elevesDef: [string, string, string][] = [
      ['Amina', 'Hassan', '6ème A'],
      ['Djibrine', 'Oumar', '6ème A'],
      ['Halima', 'Adam', '6ème A'],
      ['Youssouf', 'Brahim', '6ème A'],
      ['Mariam', 'Idriss', '5ème B'],
      ['Abakar', 'Souleymane', '5ème B'],
      ['Zara', 'Mahamat', '5ème B'],
      ['Kaltouma', 'Djime', 'Terminale S'],
      ['Ahmat', 'Souleymane', 'Terminale S'],
      ['Fatime', 'Hassan', 'Terminale S'],
    ];
    for (const [prenom, nom, classeNom] of elevesDef) {
      const e = await this.creerCompte(prenom, nom, Role.ETUDIANT, etablissement.id, classes[classeNom]);
      comptes.push({ titre: 'Élève', ...e });
    }

    // Hiérarchie proviseur / censeur / surveillant
    const proviseur = await this.creerCompte('Ousmane', 'Kaya', Role.CHEF_ETABLISSEMENT, etablissement.id);
    comptes.push({ titre: 'Proviseur (chef établissement)', ...proviseur });
    const censeur = await this.creerCompte('Halimé', 'Ndjekounkosse', Role.ADMIN, etablissement.id);
    comptes.push({ titre: 'Censeur (admin)', ...censeur });
    const surveillant = await this.creerCompte('Brahim', 'Adoum', Role.VIE_SCOLAIRE, etablissement.id);
    comptes.push({ titre: 'Surveillant (vie scolaire)', ...surveillant });

    return {
      message: 'Établissement "Lycée Exemple" recréé avec toute sa hiérarchie',
      etablissement: { id: etablissement.id, nom: nomEtab, code },
      classes: classesNoms,
      matieres: matieresDef.map(([n]) => n),
      comptes,
    };
  }
}
