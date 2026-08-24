import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User context not established');
    }

    // Admins and SuperAdmins bypass all role restrictions
    if (user.role === 'superadmin' || user.role === 'admin') {
      return true;
    }

    const hasRole =
      requiredRoles.includes(user.role) ||
      (user.role === 'admin' && requiredRoles.includes('superadmin')) ||
      (user.role === 'superadmin' && requiredRoles.includes('admin'));

    if (!hasRole) {
      throw new ForbiddenException(
        `User role '${user.role}' lacks the required role: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
