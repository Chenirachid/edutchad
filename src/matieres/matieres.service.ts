import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';

const professeurSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class MatieresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMatiereDto) {
    return this.prisma.matiere.create({ data: dto });
  }

  findAll() {
    return this.prisma.matiere.findMany();
  }

  async findOne(id: number) {
    const matiere = await this.prisma.matiere.findUnique({
      where: { id },
      include: {
        enseignements: { include: { classe: true, professeur: { select: professeurSelect } } },
      },
    });

    if (!matiere) {
      throw new NotFoundException(`Matière ${id} introuvable`);
    }

    return matiere;
  }

  async update(id: number, dto: UpdateMatiereDto) {
    await this.findOne(id);
    return this.prisma.matiere.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.matiere.delete({ where: { id } });
  }
}
