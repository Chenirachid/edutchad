import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload) {
    const where: Prisma.UserWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        numeroEtudiant: true,
        classeId: true,
        createdAt: true,
      },
    });
  }
}