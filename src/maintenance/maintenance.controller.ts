import { Controller, Get, Query, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-ajout-chef-2026';
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

  @Get('ajouter-chef-etablissement')
  async ajouterChefEtablissement(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const etablissement = await this.prisma.etablissement.findFirst({
      where: { nom: 'Dossier scientifique de la Renaissance' },
    });
    if (!etablissement) {
      throw new NotFoundException('Établissement introuvable');
    }

    const prenom = 'Isabelle';
    const nom = 'Chastain';
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
        role: Role.CHEF_ETABLISSEMENT,
        etablissementId: etablissement.id,
      },
    });

    return {
      message: `Chef d'établissement créé pour "${etablissement.nom}"`,
      compte: {
        id: user.id,
        prenom,
        nom,
        role: user.role,
        identifiant,
        codeActivation,
      },
    };
  }
}
