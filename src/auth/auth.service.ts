import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { buildBaseEmail, formatNumeroEtudiant } from '../common/email-generator';

const SALT_ROUNDS = 10;
const MAX_TENTATIVES = 5;
const DUREE_VERROU_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  async register(dto: RegisterDto) {
    const role = dto.role ?? Role.ETUDIANT;

    let etablissementId: number | null = null;
    if (role !== Role.CHEF_PROJET) {
      if (!dto.etablissementId) {
        throw new BadRequestException(
          "Un établissement est requis pour ce rôle (etablissementId)",
        );
      }
      const etablissement = await this.prisma.etablissement.findUnique({
        where: { id: dto.etablissementId },
      });
      if (!etablissement) {
        throw new NotFoundException(`Établissement ${dto.etablissementId} introuvable`);
      }
      etablissementId = etablissement.id;
    }

    const email = await this.generateUniqueEmail(dto.prenom, dto.nom, role);
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    let user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email,
        password: hashedPassword,
        role,
        etablissementId,
      },
    });

    if (role === Role.ETUDIANT) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { numeroEtudiant: formatNumeroEtudiant(user.id) },
      });
    }

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (user.verrouJusqua && user.verrouJusqua > new Date()) {
      const minutesRestantes = Math.ceil(
        (user.verrouJusqua.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Compte temporairement verrouillé suite à plusieurs échecs. Réessayez dans ${minutesRestantes} minute(s).`,
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      const tentatives = user.tentativesEchouees + 1;
      const verrouille = tentatives >= MAX_TENTATIVES;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          tentativesEchouees: verrouille ? 0 : tentatives,
          verrouJusqua: verrouille
            ? new Date(Date.now() + DUREE_VERROU_MINUTES * 60_000)
            : null,
        },
      });

      if (verrouille) {
        throw new UnauthorizedException(
          `Trop de tentatives échouées. Compte verrouillé ${DUREE_VERROU_MINUTES} minutes.`,
        );
      }

      throw new UnauthorizedException('Identifiants invalides');
    }

    if (user.tentativesEchouees > 0 || user.verrouJusqua) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { tentativesEchouees: 0, verrouJusqua: null },
      });
    }

    return this.buildAuthResponse(user);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const matches = await bcrypt.compare(dto.ancienMotDePasse, user.password);
    if (!matches) {
      throw new BadRequestException("L'ancien mot de passe est incorrect");
    }

    const hashedPassword = await bcrypt.hash(dto.nouveauMotDePasse, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe mis à jour avec succès' };
  }

  private buildAuthResponse(user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: JwtPayload['role'];
    numeroEtudiant?: string | null;
    etablissementId: number | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      etablissementId: user.etablissementId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        numeroEtudiant: user.numeroEtudiant ?? null,
        etablissementId: user.etablissementId,
      },
    };
  }
}
