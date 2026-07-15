import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { buildBaseEmail, formatNumeroEtudiant } from '../common/email-generator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  numeroEtudiant: true,
  classeId: true,
  etablissementId: true,
  actif: true,
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

  async create(dto: CreateUserDto, currentUser: JwtPayload) {
    if (dto.classeId) {
      const classe = await this.prisma.classe.findUnique({
        where: { id: dto.classeId },
      });
      if (!classe) {
        throw new BadRequestException(`Classe ${dto.classeId} introuvable`);
      }
    }

    const role = dto.role ?? Role.ETUDIANT;

    // Un admin crée toujours dans son propre établissement.
    // Le chef de projet doit préciser l'établissement (sauf pour créer un autre chef de projet).
    let etablissementId: number | null = null;
    if (role !== Role.CHEF_PROJET) {
      etablissementId =
        currentUser.role === Role.CHEF_PROJET
          ? dto.etablissementId ?? null
          : currentUser.etablissementId;

      if (!etablissementId) {
        throw new BadRequestException(
          "Un établissement est requis pour créer ce compte (etablissementId)",
        );
      }
      const etablissement = await this.prisma.etablissement.findUnique({
        where: { id: etablissementId },
      });
      if (!etablissement) {
        throw new BadRequestException(`Établissement ${etablissementId} introuvable`);
      }
    }

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
        etablissementId,
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

  findAll(currentUser: JwtPayload) {
    const where: Prisma.UserWhereInput =
      currentUser.role === Role.CHEF_PROJET
        ? {}
        : { etablissementId: currentUser.etablissementId };

    return this.prisma.user.findMany({
      where,
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

  async toggleActif(id: number) {
    const cible = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { actif: !cible.actif },
      select: userSelect,
    });
  }

  async remove(id: number, currentUser: JwtPayload) {
    const cible = await this.findOne(id);

    if (cible.role === Role.ADMIN && currentUser.role !== Role.CHEF_PROJET) {
      const demande = await this.prisma.demandeSuppressionAdmin.create({
        data: { cibleId: id, demandeurId: currentUser.sub },
      });

      const chefs = await this.prisma.user.findMany({
        where: { role: Role.CHEF_PROJET },
      });

      await Promise.all(
        chefs.map((chef) =>
          this.prisma.message.create({
            data: {
              contenu: `Demande de suppression du compte admin ${cible.prenom} ${cible.nom} (${cible.email}), demandée par le user #${currentUser.sub}. Rends-toi dans « Demandes de suppression » pour valider ou refuser.`,
              expediteurId: currentUser.sub,
              destinataireId: chef.id,
            },
          }),
        ),
      );

      return {
        enAttente: true,
        message:
          'La suppression de ce compte admin nécessite la validation du chef de projet. Une demande lui a été envoyée.',
        demandeId: demande.id,
      };
    }

    try {
      return await this.prisma.user.delete({ where: { id }, select: userSelect });
    } catch (err) {
      throw new BadRequestException(
        "Impossible de supprimer ce compte : il a de l'historique associé (notes, absences, enseignements, messages…). Utilise plutôt « Désactiver » pour bloquer son accès tout en conservant l'historique.",
      );
    }
  }
}
