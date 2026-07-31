import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBulletinMatiereDto } from './dto/upsert-bulletin-matiere.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class BulletinMatiereService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: UpsertBulletinMatiereDto, currentUser: JwtPayload) {
    if (currentUser.role === Role.PROFESSEUR) {
      const enseignement = await this.prisma.enseignement.findUnique({
        where: { id: dto.enseignementId },
      });
      if (!enseignement || enseignement.professeurId !== currentUser.sub) {
        throw new ForbiddenException(
          'Vous ne pouvez renseigner ce contenu que pour vos propres matières/classes',
        );
      }
    }

    return this.prisma.bulletinMatiere.upsert({
      where: {
        etudiantId_enseignementId_trimestre: {
          etudiantId: dto.etudiantId,
          enseignementId: dto.enseignementId,
          trimestre: dto.trimestre,
        },
      },
      create: dto,
      update: {
        elementsProgramme: dto.elementsProgramme,
        appreciationTravail: dto.appreciationTravail,
        appreciationAvis: dto.appreciationAvis,
      },
    });
  }

  // Utilisé en interne par BulletinsService pour joindre programme + appréciations
  findPourEtudiantEtTrimestre(etudiantId: number, trimestre: number) {
    return this.prisma.bulletinMatiere.findMany({
      where: { etudiantId, trimestre },
    });
  }

  findPourEnseignement(enseignementId: number, trimestre: number) {
    return this.prisma.bulletinMatiere.findMany({
      where: { enseignementId, trimestre },
    });
  }
}
