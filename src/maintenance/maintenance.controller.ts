import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/email-generator';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-rattache-2026';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('rattacher-etablissement-origine')
  async rattacherEtablissementOrigine(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const nomEtab = 'EduCheni';
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

    const utilisateurs = await this.prisma.user.updateMany({
      where: { etablissementId: null, role: { not: Role.CHEF_PROJET } },
      data: { etablissementId: etablissement.id },
    });
    const classes = await this.prisma.classe.updateMany({
      where: { etablissementId: null },
      data: { etablissementId: etablissement.id },
    });
    const matieres = await this.prisma.matiere.updateMany({
      where: { etablissementId: null },
      data: { etablissementId: etablissement.id },
    });
    const parametres = await this.prisma.parametrePlateforme.updateMany({
      where: { etablissementId: null },
      data: { etablissementId: etablissement.id },
    });
    const actualites = await this.prisma.actualite.updateMany({
      where: { etablissementId: null },
      data: { etablissementId: etablissement.id },
    });
    const sondages = await this.prisma.sondage.updateMany({
      where: { etablissementId: null },
      data: { etablissementId: etablissement.id },
    });
    const groupes = await this.prisma.groupe.updateMany({
      where: { etablissementId: null },
      data: { etablissementId: etablissement.id },
    });

    return {
      message: `Établissement "${nomEtab}" créé et données existantes rattachées`,
      etablissement: { id: etablissement.id, nom: nomEtab, code },
      rattaches: {
        utilisateurs: utilisateurs.count,
        classes: classes.count,
        matieres: matieres.count,
        parametres: parametres.count,
        actualites: actualites.count,
        sondages: sondages.count,
        groupes: groupes.count,
      },
    };
  }
}
