import { Controller, Get, Query, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-hierarchie-2026';
const SALT_ROUNDS = 10;

function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
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

  private async creerCompte(prenom: string, nom: string, role: Role, etablissementId: number) {
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
      },
    });

    return { id: user.id, prenom, nom, role, identifiant, codeActivation };
  }

  @Get('seed-hierarchie-lycee-exemple')
  async seedHierarchie(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const etablissement = await this.prisma.etablissement.findFirst({
      where: { nom: 'Lycée Exemple' },
    });
    if (!etablissement) {
      throw new NotFoundException('Établissement "Lycée Exemple" introuvable');
    }

    const proviseur = await this.creerCompte('Ousmane', 'Kaya', Role.CHEF_ETABLISSEMENT, etablissement.id);
    const censeur = await this.creerCompte('Halimé', 'Ndjekounkosse', Role.ADMIN, etablissement.id);
    const surveillant = await this.creerCompte('Brahim', 'Adoum', Role.VIE_SCOLAIRE, etablissement.id);

    return {
      message: 'Comptes proviseur, censeur et surveillant créés pour "Lycée Exemple"',
      comptes: [
        { titre: 'Proviseur', ...proviseur },
        { titre: 'Censeur', ...censeur },
        { titre: 'Surveillant', ...surveillant },
      ],
    };
  }
}
