import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import {
  AuthResponseDto,
  AuthUserSummaryDto,
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  SwitchStoreDto,
  SyncUserWebhookDto,
} from './dto/auth.dto';
import { IAuthService } from './interfaces/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Authenticate user with Supabase Auth credentials.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`AuthService.login: Authenticating ${dto.email}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      // Local development/test fallback
      return this.buildMockAuthResponse(dto.email, 'manager');
    }

    const { data: authData, error: authError } =
      await client.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (authError || !authData.session || !authData.user) {
      this.logger.warn(`AuthService.login failed for ${dto.email}: ${authError?.message}`);
      throw new UnauthorizedException(authError?.message || 'Invalid email or password');
    }

    const userSummary = await this.resolveUserProfile(authData.user);

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresIn: authData.session.expires_in || 3600,
      tokenType: 'Bearer',
      user: userSummary,
    };
  }

  /**
   * Register new user, organization, default store, and synchronize profiles.
   */
  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    this.logger.log(`AuthService.signup: Registering ${dto.email} for org '${dto.organizationName}'`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockAuthResponse(dto.email, 'superadmin');
    }

    // 1. Create user in Supabase Auth GoTrue
    const { data: authData, error: authError } = await client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          name: dto.name,
          organization_name: dto.organizationName,
          role: 'superadmin',
        },
      },
    });

    if (authError || !authData.user) {
      this.logger.error(`Supabase Auth signup failed: ${authError?.message}`);
      throw new BadRequestException(authError?.message || 'Failed to create user account');
    }

    const userId = authData.user.id;
    const orgSlug =
      dto.organizationSlug ||
      dto.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // 2. Create Organization record
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .insert({
        name: dto.organizationName,
        slug: `${orgSlug}-${Date.now().toString(36)}`,
        plan_tier: 'trial',
        created_by: userId,
      })
      .select('id, name')
      .single();

    if (orgError || !orgData) {
      this.logger.error(`Failed to create organization: ${orgError?.message}`);
      throw new InternalServerErrorException('Failed to initialize organization workspace');
    }

    // 3. Create Default Store for Organization
    const { data: storeData, error: storeError } = await client
      .from('stores')
      .insert({
        organization_id: orgData.id,
        store_code: 'MAIN-01',
        name: `${dto.organizationName} Main Branch`,
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        created_by: userId,
      })
      .select('id')
      .single();

    if (storeError || !storeData) {
      this.logger.error(`Failed to create default store: ${storeError?.message}`);
      throw new InternalServerErrorException('Failed to initialize default store location');
    }

    // 4. Create Store Settings
    await client.from('store_settings').insert({
      store_id: storeData.id,
      created_by: userId,
    });

    // 5. Synchronize User into public.users table
    const { error: userSyncError } = await client.from('users').upsert({
      id: userId,
      organization_id: orgData.id,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      default_store_id: storeData.id,
      is_active: true,
      created_by: userId,
    });

    if (userSyncError) {
      this.logger.error(`Failed to sync public.users record: ${userSyncError.message}`);
      throw new InternalServerErrorException('Failed to complete user profile synchronization');
    }

    // 6. Assign SuperAdmin role to user for this store
    const { data: roleData } = await client
      .from('roles')
      .select('id')
      .eq('name', 'superadmin')
      .single();

    if (roleData) {
      await client.from('user_store_assignments').insert({
        user_id: userId,
        store_id: storeData.id,
        role_id: roleData.id,
        assigned_by: userId,
      });
    }

    const session = authData.session;

    return {
      accessToken: session?.access_token || 'initial-signup-token',
      refreshToken: session?.refresh_token || 'initial-refresh-token',
      expiresIn: session?.expires_in || 3600,
      tokenType: 'Bearer',
      user: {
        id: userId,
        email: dto.email,
        name: dto.name,
        role: 'superadmin',
        organizationId: orgData.id,
        organizationName: orgData.name,
        defaultStoreId: storeData.id,
        assignedStoreIds: [storeData.id],
        permissions: ['*'],
      },
    };
  }

  /**
   * Refresh session tokens via Supabase Auth Refresh Token Rotation (RTR).
   */
  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.logger.log('AuthService.refreshToken: Refreshing session');
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockAuthResponse('refreshed.user@stockpulse.io', 'manager');
    }

    const { data: authData, error: authError } = await client.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (authError || !authData.session || !authData.user) {
      this.logger.warn(`AuthService.refreshToken failed: ${authError?.message}`);
      throw new UnauthorizedException(authError?.message || 'Invalid or expired refresh token');
    }

    const userSummary = await this.resolveUserProfile(authData.user);

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresIn: authData.session.expires_in || 3600,
      tokenType: 'Bearer',
      user: userSummary,
    };
  }

  /**
   * Revoke active user session and logout.
   */
  async logout(userId: string, token?: string): Promise<void> {
    this.logger.log(`AuthService.logout: Terminating session for user ${userId}`);
    const client = this.supabaseService.getAdminClient();

    if (client && token) {
      try {
        await client.auth.admin.signOut(token);
      } catch (err: any) {
        this.logger.warn(`Supabase signOut warning: ${err.message}`);
      }
    }
  }

  /**
   * Switch active store context and return updated user session.
   */
  async switchStore(userId: string, dto: SwitchStoreDto): Promise<AuthResponseDto> {
    this.logger.log(`AuthService.switchStore: User ${userId} switching to store ${dto.storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      const mock = this.buildMockAuthResponse('manager@stockpulse.io', 'manager');
      mock.user.defaultStoreId = dto.storeId;
      return mock;
    }

    // Verify user is assigned to target store (or is superadmin)
    const { data: userRecord } = await client
      .from('users')
      .select(`
        id,
        email,
        name,
        organization_id,
        user_store_assignments (
          store_id,
          roles (
            name
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (!userRecord) {
      throw new NotFoundException('User profile not found');
    }

    const assignments = userRecord.user_store_assignments || [];
    const targetAssignment = assignments.find((a: any) => a.store_id === dto.storeId);

    if (!targetAssignment) {
      throw new UnauthorizedException(`User is not authorized for target store '${dto.storeId}'`);
    }

    // Update user default_store_id in database
    await client
      .from('users')
      .update({ default_store_id: dto.storeId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    const rolesRef = (targetAssignment as any)?.roles;
    const role = Array.isArray(rolesRef) ? rolesRef[0]?.name : rolesRef?.name || 'staff';
    const assignedStoreIds = assignments.map((a: any) => a.store_id);

    return {
      accessToken: 'switched-store-access-token',
      refreshToken: 'switched-store-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        id: userId,
        email: userRecord.email,
        name: userRecord.name,
        role,
        organizationId: userRecord.organization_id,
        defaultStoreId: dto.storeId,
        assignedStoreIds,
        permissions: role === 'superadmin' ? ['*'] : [],
      },
    };
  }

  /**
   * Synchronize single user record between Supabase Auth and public.users domain table.
   */
  async syncUser(payload: Record<string, unknown>): Promise<void> {
    this.logger.log(`AuthService.syncUser: Syncing user record ${payload.id || payload.email}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) return;

    const id = payload.id as string;
    const email = payload.email as string;
    const meta = (payload.user_metadata || payload.raw_user_meta_data || {}) as Record<string, any>;
    const name = meta.name || email?.split('@')[0] || 'User';
    const organizationId = meta.organization_id || '01915dfa-9012-7000-8000-000000000001';

    await client.from('users').upsert({
      id,
      email,
      name,
      organization_id: organizationId,
      is_active: true,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Handle Supabase database / Auth Webhooks (`INSERT`, `UPDATE`, `DELETE` events).
   */
  async handleAuthWebhook(
    payload: SyncUserWebhookDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`AuthService.handleAuthWebhook: Event ${payload.type} on table ${payload.table}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return { success: true, message: 'Mock webhook handled' };
    }

    const { type, record, old_record } = payload;

    switch (type) {
      case 'INSERT':
      case 'UPDATE': {
        if (!record?.id || !record?.email) {
          throw new BadRequestException('Webhook payload missing required user fields');
        }
        await this.syncUser(record);
        break;
      }
      case 'DELETE': {
        const userId = old_record?.id || record?.id;
        if (userId) {
          await client
            .from('users')
            .update({
              is_active: false,
              deleted_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }
      default:
        this.logger.warn(`Unhandled webhook event type: ${type}`);
    }

    return { success: true, message: `Webhook event '${type}' processed successfully` };
  }

  /**
   * Helper to resolve full user profile, store assignments, and RBAC roles from PostgreSQL.
   */
  private async resolveUserProfile(authUser: any): Promise<AuthUserSummaryDto> {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id: authUser.id,
        email: authUser.email,
        name: 'User',
        role: 'manager',
        organizationId: '01915dfa-9012-7000-8000-000000000001',
        assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'],
        permissions: ['*'],
      };
    }

    const { data: userProfile } = await client
      .from('users')
      .select(`
        id,
        email,
        name,
        organization_id,
        default_store_id,
        organizations (
          name
        ),
        user_store_assignments (
          store_id,
          roles (
            name
          )
        )
      `)
      .eq('id', authUser.id)
      .is('deleted_at', null)
      .single();

    let assignedStoreIds: string[] = [];
    let role = authUser.user_metadata?.role || 'staff';
    const name = userProfile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
    const organizationId =
      userProfile?.organization_id ||
      authUser.user_metadata?.organization_id ||
      '01915dfa-9012-7000-8000-000000000001';
    const organizationName =
      (userProfile?.organizations as any)?.name || authUser.user_metadata?.organization_name;

    if (userProfile?.user_store_assignments && Array.isArray(userProfile.user_store_assignments)) {
      assignedStoreIds = userProfile.user_store_assignments.map((a: any) => a.store_id);
      const firstAssignmentRole = (userProfile.user_store_assignments[0] as any)?.roles;
      if (Array.isArray(firstAssignmentRole) && firstAssignmentRole[0]?.name) {
        role = firstAssignmentRole[0].name;
      } else if (firstAssignmentRole?.name) {
        role = firstAssignmentRole.name;
      }
    } else if (authUser.user_metadata?.assigned_store_ids) {
      assignedStoreIds = authUser.user_metadata.assigned_store_ids;
    }

    return {
      id: authUser.id,
      email: authUser.email || '',
      name,
      role,
      organizationId,
      organizationName,
      defaultStoreId: userProfile?.default_store_id,
      assignedStoreIds,
      permissions: role === 'superadmin' ? ['*'] : [],
    };
  }

  /**
   * Helper to generate mock auth response for testing / offline development.
   */
  private buildMockAuthResponse(email: string, role: string): AuthResponseDto {
    return {
      accessToken: 'mock-jwt-access-token',
      refreshToken: 'mock-jwt-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: {
        id: '01915dfa-9012-7000-8000-000000000099',
        email,
        name: email.split('@')[0],
        role,
        organizationId: '01915dfa-9012-7000-8000-000000000001',
        organizationName: 'StockPulse Demo Restaurant Group',
        defaultStoreId: '01915dfa-9012-7000-8000-000000000002',
        assignedStoreIds: ['01915dfa-9012-7000-8000-000000000002'],
        permissions: role === 'superadmin' ? ['*'] : ['inventory:view', 'stock_count:conduct'],
      },
    };
  }
}
