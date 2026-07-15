import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Le chef d'établissement a tous les droits d'un ADMIN (mais reste cantonné
    // à son propre établissement, ce que gère la couche service via etablissementId)
    if (user?.role === Role.CHEF_ETABLISSEMENT && requiredRoles.includes(Role.ADMIN)) {
      return true;
    }

    return !!user && requiredRoles.includes(user.role);
  }
}
