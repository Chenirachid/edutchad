import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtablissementDto } from './dto/create-etablissement.dto';
import { UpdateEtablissementDto } from './dto/update-etablissement.dto';
import { slugify } from '../common/email-generator';
import { UsersService } from '../users/users.service';

@Injectable()
export class EtablissementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  private async genererCodeUnique(nom: string) {
    const base = slugify(nom) || 'etablissement';
    let code = base;
    let counter = 1;

    while (await this.prisma.etablissement.findUnique({ where: { code } })) {
      counter++;
      code = `${base}-${counter}`;
    }

    return code;
  }

  async create(dto: CreateEtablissementDto) {
    const code = await this.genererCodeUnique(dto.nom);

    const etablissement = await this.prisma.etablissement.create({
      data: { nom: dto.nom, code },
    });

    // Crée automatiquement les paramètres par défaut de ce nouvel établissement
    await this.prisma.parametrePlateforme.create({
      data: { nomEtablissement: dto.nom, etablissementId: etablissement.id },
    });

    return etablissement;
  }

  async findAll() {
    const etablissements = await this.prisma.etablissement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      etablissements.map(async (e) => {
        const [nbUtilisateurs, nbClasses] = await Promise.all([
          this.prisma.user.count({ where: { etablissementId: e.id } }),
          this.prisma.classe.count({ where: { etablissementId: e.id } }),
        ]);
        return { ...e, nbUtilisateurs, nbClasses };
      }),
    );
  }

  async findOne(id: number) {
    const etablissement = await this.prisma.etablissement.findUnique({ where: { id } });
    if (!etablissement) {
      throw new NotFoundException(`Établissement ${id} introuvable`);
    }
    return etablissement;
  }

  findByCode(code: string) {
    return this.prisma.etablissement.findUnique({ where: { code } });
  }

  async update(id: number, dto: UpdateEtablissementDto) {
    await this.findOne(id);
    return this.prisma.etablissement.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.usersService.supprimerEtablissement(id);
  }
}
