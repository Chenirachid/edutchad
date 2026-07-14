import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { buildBaseEmail, formatNumeroEtudiant } from '../common/email-generator';

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  numeroEtudiant: true,
  classeId: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueEmail(prenom: string, nom: string, role: Role) {
    const base = buildBaseEmail(prenom, nom, role);
    const [localPart, domain] = base.split('@');
    let email = base;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { email } })) {
      counter++;
      email = `${localPart}${counter}@${domain}`;
    }

    return email;
  }

  async create(dto: CreateUserDto) {
    if (dto.classeId) {
      const classe = await this.prisma.classe.findUnique({
        where: { id: dto.classeId },
      });
      if (!classe) {
        throw new BadRequestException(`Classe ${dto.classeId} introuvable`);
      }
    }

    const role = dto.role ?? Role.ETUDIANT;
    const email = await this.generateUniqueEmail(dto.prenom, dto.nom, role);
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email,
        password: hashedPassword,
        role,
        classeId: dto.classeId,
      },
    });

    if (role === Role.ETUDIANT) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { numeroEtudiant: formatNumeroEtudiant(user.id) },
        select: userSelect,
      });
    }

    return this.prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.classeId) {
      const classe = await this.prisma.classe.findUnique({
        where: { id: dto.classeId },
      });
      if (!classe) {
        throw new BadRequestException(`Classe ${dto.classeId} introuvable`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(dto.nouveauMotDePasse, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id }, select: userSelect });
  }
}
