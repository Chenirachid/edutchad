import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-env',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Mis à jour en tâche de fond, sans ralentir la requête ni faire échouer
    // l'authentification si ça rate.
    this.prisma.user
      .update({ where: { id: payload.sub }, data: { derniereActivite: new Date() } })
      .catch(() => undefined);

    return payload;
  }
}
