import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { UpdateClasseDto } from './dto/update-classe.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const etudiantSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClasseDto, currentUser: JwtPayload) {
    const etablissementId =
      currentUser.role === Role.CHEF_PROJET
        ? dto.etablissementId ?? null
        : currentUser.etablissementId;

    if (!etablissementId) {
      throw new BadRequestException(
        "Un établissement est requis pour créer une classe (etablissementId)",
      );
    }

    return this.prisma.classe.create({
      data: { nom: dto.nom, anneeScolaire: dto.anneeScolaire, etablissementId },
    });
  }

  findAll(currentUser: JwtPayload) {
    const where: Prisma.ClasseWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    return this.prisma.classe.findMany({
      where,
      include: { etudiants: { select: etudiantSelect } },
    });
  }

  async findOne(id: number) {
    const classe = await this.prisma.classe.findUnique({
      where: { id },
      include: {
        etudiants: { select: etudiantSelect },
        enseignements: { include: { matiere: true, professeur: { select: etudiantSelect } } },
      },
    });

    if (!classe) {
      throw new NotFoundException(`Classe ${id} introuvable`);
    }

    return classe;
  }

  async update(id: number, dto: UpdateClasseDto) {
    await this.findOne(id);
    return this.prisma.classe.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.classe.delete({ where: { id } });
  }
}
