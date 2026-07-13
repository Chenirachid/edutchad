import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClasseDto } from './dto/create-classe.dto';
import { UpdateClasseDto } from './dto/update-classe.dto';

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

  create(dto: CreateClasseDto) {
    return this.prisma.classe.create({ data: dto });
  }

  findAll() {
    return this.prisma.classe.findMany({
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
