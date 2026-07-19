import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Route de maintenance TEMPORAIRE — à retirer une fois utilisée.
const CLE_MAINTENANCE = 'cheni-fix-notes-2026';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('rattacher-notes-orphelines')
  async rattacherNotesOrphelines(@Query('cle') cle: string) {
    if (cle !== CLE_MAINTENANCE) {
      throw new UnauthorizedException('Clé invalide');
    }

    const notesOrphelines = await this.prisma.note.findMany({
      where: { epreuveId: null },
      select: { id: true, enseignementId: true, createdAt: true },
    });

    const parEnseignement = new Map();
    for (const n of notesOrphelines) {
      if (!parEnseignement.has(n.enseignementId)) parEnseignement.set(n.enseignementId, []);
      parEnseignement.get(n.enseignementId).push({ id: n.id, createdAt: n.createdAt });
    }

    const resultats: any[] = [];

    for (const [enseignementId, notes] of parEnseignement) {
      const dateReference = notes.reduce(
        (min, n) => (n.createdAt < min ? n.createdAt : min),
        notes[0].createdAt,
      );

      const epreuve = await this.prisma.epreuve.create({
        data: {
          enseignementId,
          titre: 'Évaluation initiale',
          type: 'CONTROLE',
          date: dateReference,
          coefficient: 1,
        },
      });

      await this.prisma.note.updateMany({
        where: { id: { in: notes.map((n) => n.id) } },
        data: { epreuveId: epreuve.id },
      });

      resultats.push({ enseignementId, epreuveId: epreuve.id, notesRattachees: notes.length });
    }

    return {
      message: `${resultats.length} épreuve(s) créée(s) pour rattacher ${notesOrphelines.length} note(s) orpheline(s)`,
      details: resultats,
    };
  }
}
