import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
// Attribue un identifiant (nom d'utilisateur) à tous les comptes qui n'en ont pas encore,
// sans toucher à leur mot de passe existant.
const CLE_MAINTENANCE = 'cheni-migration-2026';

function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('backfill-identifiants')
  async backfillIdentifiants(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const users = await this.prisma.user.findMany({ where: { identifiant: null } });
    const resultats: { id: number; nom: string; prenom: string; role: string; identifiant: string }[] = [];

    for (const user of users) {
      const base = `${normaliser(user.prenom)}.${normaliser(user.nom)}`;
      let identifiant = base;
      let counter = 1;
      while (await this.prisma.user.findUnique({ where: { identifiant } })) {
        counter++;
        identifiant = `${base}${counter}`;
      }

      await this.prisma.user.update({ where: { id: user.id }, data: { identifiant } });
      resultats.push({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        identifiant,
      });
    }

    return {
      message: `${resultats.length} compte(s) mis à jour`,
      comptes: resultats,
    };
  }
}
