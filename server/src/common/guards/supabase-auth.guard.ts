import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../database/supabase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token is empty');
    }

    const client = this.supabaseService.getAdminClient();

    if (!client) {
      // Mock / fallback for local test environment without active Supabase server credentials
      request.user = {
        id: '01915dfa-9012-7000-8000-000000000099',
        email: 'dev@stockpulse.io',
        name: 'Development User',
        organizationId: '01915dfa-9012-7000-8000-000000000001',
        organizationName: 'StockPulse Demo Org',
        role: 'manager',
        permissions: ['*'],
        assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'],
      } as AuthenticatedUser;
      return true;
    }

    try {
      const { data: authData, error: authError } = await client.auth.getUser(token);

      if (authError || !authData?.user) {
        throw new UnauthorizedException(authError?.message || 'Invalid or expired authentication token');
      }

      const authUser = authData.user;

      // Query domain public.users table to fetch synced role, organization, and store assignments
      let userProfile: any = null;
      try {
        const query: any = client
          .from('users')
          .select(`
            id,
            email,
            name,
            organization_id,
            default_store_id,
            is_active,
            deleted_at,
            user_store_assignments (
              store_id,
              roles (
                name
              )
            )
          `)
          .eq('id', authUser.id);

        const res = typeof query.maybeSingle === 'function' ? await query.maybeSingle() : await query.single();
        userProfile = res?.data;
      } catch (err: any) {
        this.logger.debug(`Could not query users table: ${err.message}`);
      }

      // Check if user account is deactivated or deleted
      if (userProfile) {
        if (userProfile.is_active === false || Boolean(userProfile.deleted_at)) {
          this.logger.warn(`Rejected request for deactivated user ${authUser.id} (${authUser.email})`);
          throw new ForbiddenException('User account has been deactivated or disabled');
        }
      }

      let assignedStoreIds: string[] = [];
      let role = authUser.user_metadata?.role || 'staff';
      const name = userProfile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
      const organizationId = userProfile?.organization_id || authUser.user_metadata?.organization_id || '01915dfa-9012-7000-8000-000000000001';

      if (userProfile?.user_store_assignments && Array.isArray(userProfile.user_store_assignments)) {
        assignedStoreIds = userProfile.user_store_assignments.map((assignment: any) => assignment.store_id);
        const firstAssignmentRole = (userProfile.user_store_assignments[0] as any)?.roles;
        if (Array.isArray(firstAssignmentRole) && firstAssignmentRole[0]?.name) {
          role = firstAssignmentRole[0].name;
        } else if (firstAssignmentRole?.name) {
          role = firstAssignmentRole.name;
        }
      } else if (authUser.user_metadata?.assigned_store_ids) {
        assignedStoreIds = authUser.user_metadata.assigned_store_ids;
      }

      const ROLE_PERMISSIONS: Record<string, string[]> = {
        superadmin: ['*'],
        admin: ['*'],
        manager: [
          'inventory:create',
          'inventory:view',
          'inventory:adjust',
          'inventory:archive',
          'stock_count:conduct',
          'stock_count:approve',
          'ocr:scan',
          'ocr:view',
          'ocr:review',
          'procurement:create',
          'procurement:view',
          'procurement:approve',
          'procurement:receive',
          'notifications:send',
          'audit:read',
        ],
        supervisor: [
          'inventory:view',
          'inventory:adjust',
          'stock_count:conduct',
          'ocr:scan',
          'ocr:view',
          'ocr:review',
          'procurement:create',
          'procurement:view',
          'procurement:receive',
        ],
        staff: [
          'inventory:view',
          'stock_count:conduct',
          'ocr:scan',
          'ocr:view',
          'procurement:view',
          'procurement:receive',
        ],
        auditor: [
          'inventory:view',
          'stock_count:conduct',
          'ocr:view',
          'procurement:view',
          'audit:read',
        ],
      };

      const authenticatedUser: AuthenticatedUser = {
        id: authUser.id,
        email: authUser.email || '',
        name,
        organizationId,
        role,
        permissions: authUser.user_metadata?.permissions || ROLE_PERMISSIONS[role] || (role === 'superadmin' || role === 'admin' ? ['*'] : []),
        assignedStoreIds,
        defaultStoreId: userProfile?.default_store_id,
      };

      request.user = authenticatedUser;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.error(`SupabaseAuthGuard authentication failure: ${err.message}`);
      throw new UnauthorizedException('Authentication verification failed');
    }
  }
}
