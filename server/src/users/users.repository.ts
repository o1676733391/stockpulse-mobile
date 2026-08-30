import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { IUserRepository } from './interfaces/user.repository.interface';

@Injectable()
export class UsersRepository implements IUserRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<UserResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data, error } = await client
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        organization_id,
        default_store_id,
        is_active,
        user_store_assignments (
          store_id,
          roles (
            name
          )
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    let role = 'staff';
    const assignedStoreIds: string[] = [];
    if (data.user_store_assignments && Array.isArray(data.user_store_assignments)) {
      data.user_store_assignments.forEach((assignment: any) => {
        if (assignment.store_id) assignedStoreIds.push(assignment.store_id);
        const rolesRef = assignment.roles;
        if (Array.isArray(rolesRef) && rolesRef[0]?.name) {
          role = rolesRef[0].name;
        } else if (rolesRef?.name) {
          role = rolesRef.name;
        }
      });
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role,
      organizationId: data.organization_id,
      assignedStoreIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await client
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        organization_id,
        default_store_id,
        is_active,
        user_store_assignments (
          store_id,
          roles (
            name
          )
        )
      `)
      .ilike('email', normalizedEmail)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;

    let role = 'staff';
    const assignedStoreIds: string[] = [];
    if (data.user_store_assignments && Array.isArray(data.user_store_assignments)) {
      data.user_store_assignments.forEach((assignment: any) => {
        if (assignment.store_id) assignedStoreIds.push(assignment.store_id);
        const rolesRef = assignment.roles;
        if (Array.isArray(rolesRef) && rolesRef[0]?.name) {
          role = rolesRef[0].name;
        } else if (rolesRef?.name) {
          role = rolesRef.name;
        }
      });
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name || '',
      phone: data.phone || undefined,
      role,
      organizationId: data.organization_id,
      assignedStoreIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async findByOrganization(organizationId: string): Promise<UserResponseDto[]> {
    const all = await this.findAll();
    return all.filter((u) => u.organizationId === organizationId);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return [];

    const { data, error } = await client
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        organization_id,
        default_store_id,
        is_active,
        user_store_assignments (
          store_id,
          roles (
            name
          )
        )
      `)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error || !data) {
      this.logger.error(`Error fetching users: ${error?.message}`);
      return [];
    }

    return data.map((u: any) => {
      let role = 'staff';
      const assignedStoreIds: string[] = [];
      if (u.user_store_assignments && Array.isArray(u.user_store_assignments)) {
        u.user_store_assignments.forEach((assignment: any) => {
          if (assignment.store_id) assignedStoreIds.push(assignment.store_id);
          const rolesRef = assignment.roles;
          if (Array.isArray(rolesRef) && rolesRef[0]?.name) {
            role = rolesRef[0].name;
          } else if (rolesRef?.name) {
            role = rolesRef.name;
          }
        });
      }

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role,
        organizationId: u.organization_id,
        assignedStoreIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  async create(data: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`UsersRepository.create: ${data.email}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    // Check duplicate email
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(`User with email '${data.email}' already exists`);
    }

    // Lookup role in roles table
    const targetRole = data.role === 'superadmin' ? 'admin' : (data.role || 'staff');
    const { data: roleRow } = await client
      .from('roles')
      .select('id, name')
      .eq('name', targetRole)
      .single();

    const roleId = roleRow?.id || '01915dfa-9012-7000-8000-000000000005';

    // 1. Create in Supabase Auth GoTrue first
    let authUserId: string | null = null;
    const { data: authCreated } = await client.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: 'TemporaryPassword123!',
      email_confirm: true,
      user_metadata: { name: data.name },
    });

    if (authCreated?.user?.id) {
      authUserId = authCreated.user.id;
    } else {
      const { data: listData } = await client.auth.admin.listUsers();
      const existingAuth = listData?.users?.find(
        (u: any) => u.email?.toLowerCase() === data.email.trim().toLowerCase()
      );
      if (existingAuth) {
        authUserId = existingAuth.id;
      }
    }

    const insertPayload: any = {
      organization_id: data.organizationId || '01915dfa-9012-7000-8000-000000000001',
      email: data.email.trim().toLowerCase(),
      name: data.name,
      phone: data.phone || null,
      default_store_id: data.assignedStoreIds?.[0] || '01915dfa-9012-7000-8000-000000000002',
      is_active: true,
    };
    if (authUserId) {
      insertPayload.id = authUserId;
    }

    // Insert user into PostgreSQL users table
    const { data: userData, error: userError } = await client
      .from('users')
      .upsert(insertPayload)
      .select()
      .single();

    if (userError || !userData) {
      this.logger.error(`Error creating user in DB: ${userError?.message}`);
      throw new InternalServerErrorException(userError?.message || 'Failed to create user');
    }

    // Insert user_store_assignments
    const storeIds = data.assignedStoreIds?.length
      ? data.assignedStoreIds
      : ['01915dfa-9012-7000-8000-000000000002'];

    const assignmentRows = storeIds.map((storeId) => ({
      user_id: userData.id,
      store_id: storeId,
      role_id: roleId,
    }));

    await client.from('user_store_assignments').insert(assignmentRows);

    const created = await this.findById(userData.id);
    if (!created) {
      throw new InternalServerErrorException('Failed to retrieve newly created user');
    }
    return created;
  }

  async update(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`UsersRepository.update: ${id}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.phone !== undefined) updatePayload.phone = data.phone;

    const { error: userError } = await client
      .from('users')
      .update(updatePayload)
      .eq('id', id);

    if (userError) {
      this.logger.error(`Error updating user ${id}: ${userError.message}`);
      throw new InternalServerErrorException(userError.message);
    }

    // Keep Supabase Auth GoTrue user metadata & phone field perfectly in sync
    const userMetadata: Record<string, any> = {};
    if (data.name !== undefined) userMetadata.name = data.name;
    if (data.role !== undefined) userMetadata.role = data.role === 'superadmin' ? 'admin' : data.role;
    if (data.phone !== undefined) userMetadata.phone = data.phone;
    if (data.assignedStoreIds !== undefined) userMetadata.assigned_store_ids = data.assignedStoreIds;

    if (Object.keys(userMetadata).length > 0) {
      try {
        const updateParams: any = { user_metadata: userMetadata };
        if (data.phone !== undefined && data.phone !== null && data.phone.trim() !== '') {
          updateParams.phone = data.phone;
        }
        await client.auth.admin.updateUserById(id, updateParams);
      } catch (err: any) {
        this.logger.debug(`Could not synchronize Supabase Auth metadata/phone: ${err.message}`);
      }
    }

    // If role is updated, update role in user_store_assignments
    if (data.role !== undefined) {
      const targetRole = data.role === 'superadmin' ? 'admin' : data.role;
      const { data: roleRow } = await client
        .from('roles')
        .select('id, name')
        .eq('name', targetRole)
        .single();

      if (roleRow?.id) {
        await client
          .from('user_store_assignments')
          .update({ role_id: roleRow.id })
          .eq('user_id', id);
      }
    }

    // If assigned stores updated
    if (data.assignedStoreIds && data.assignedStoreIds.length > 0) {
      const roleName = data.role || existing.role || 'staff';
      const targetRole = roleName === 'superadmin' ? 'admin' : roleName;
      const { data: roleRow } = await client
        .from('roles')
        .select('id, name')
        .eq('name', targetRole)
        .single();

      const roleId = roleRow?.id || '01915dfa-9012-7000-8000-000000000005';

      await client.from('user_store_assignments').delete().eq('user_id', id);
      const rows = data.assignedStoreIds.map((storeId) => ({
        user_id: id,
        store_id: storeId,
        role_id: roleId,
      }));
      await client.from('user_store_assignments').insert(rows);
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new InternalServerErrorException('Failed to retrieve updated user');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log(`UsersRepository.delete (soft): ${id}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const now = new Date().toISOString();
    const { error } = await client
      .from('users')
      .update({
        is_active: false,
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deactivating user ${id}: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    await client
      .from('user_store_assignments')
      .update({ deleted_at: now })
      .eq('user_id', id);

    return true;
  }
}
