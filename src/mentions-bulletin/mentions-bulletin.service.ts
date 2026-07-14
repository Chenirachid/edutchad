import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetMentionDto } from './dto/set-mention.dto';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  numeroEtudiant: true,
} as const;

@Injectable()
export class MentionsBulletinService {
  constructor(private readonly prisma: PrismaService) {}

  async set(dto: SetMentionDto) {
    const etudiant = await this.prisma.user.findUnique({
      where: { numeroEtudiant: dto.numeroEtudiant },
    });
    if (!etudiant) {
      throw new NotFoundException(`Aucun étudiant avec le numéro ${dto.numeroEtudiant}`);
    }

    return this.prisma.mentionBulletin.upsert({
      where: {
        etudiantId_anneeScolaire: { etudiantId: etudiant.id, anneeScolaire: dto.anneeScolaire },
      },
      create: {
        etudiantId: etudiant.id,
        anneeScolaire: dto.anneeScolaire,
        mention: dto.mention,
        appreciation: dto.appreciation,
      },
      update: {
        mention: dto.mention,
        appreciation: dto.appreciation,
      },
      include: { etudiant: { select: etudiantSelect } },
    });
  }

  findAll() {
    return this.prisma.mentionBulletin.findMany({
      include: { etudiant: { select: etudiantSelect } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPourEtudiant(etudiantId: number, anneeScolaire: string) {
    return this.prisma.mentionBulletin.findUnique({
      where: { etudiantId_anneeScolaire: { etudiantId, anneeScolaire } },
    });
  }
}
