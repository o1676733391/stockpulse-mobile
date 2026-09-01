import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class TenantStoreGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    const storeId =
      request.headers['x-store-id'] ||
      request.params?.storeId ||
      request.query?.storeId;

    if (!storeId) {
      return true; // Not a store-scoped operation
    }

    if (!user) {
      throw new ForbiddenException('User context not established');
    }

    if (user.role === 'superadmin' || user.role === 'admin') {
      request.storeId = storeId;
      return true;
    }

    const isAssigned = user.assignedStoreIds?.includes(storeId as string);
    if (!isAssigned) {
      throw new ForbiddenException(
        `Cross-tenant access violation: User is not authorized for store '${storeId}'`,
      );
    }

    request.storeId = storeId;
    return true;
  }
}
