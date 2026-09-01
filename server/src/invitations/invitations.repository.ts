import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { StoreInvitationEntity } from './interfaces/invitation.interface';

@Injectable()
export class InvitationsRepository {
  private readonly logger = new Logger(InvitationsRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(data: Partial<StoreInvitationEntity>): Promise<StoreInvitationEntity> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      const fallback: StoreInvitationEntity = {
        id: data.id || '01915dfa-b1c4-7221-9988-51b72e04e050',
        store_id: data.store_id || '',
        organization_id: data.organization_id || '',
        email: data.email || '',
        role_id: data.role_id || '',
        token_hash: data.token_hash || '',
        invitation_code: data.invitation_code || '',
        status: data.status || 'PENDING',
        expires_at: data.expires_at || new Date(Date.now() + 7 * 86400000).toISOString(),
        created_by: data.created_by || '',
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return fallback;
    }

    const { data: created, error } = await client
      .from('store_invitations')
      .insert(data)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to create store invitation: ${error.message}`);
      throw error;
    }

    return created;
  }

  async findByStoreId(storeId: string): Promise<any[]> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from('store_invitations')
      .select(`
        *,
        stores:store_id ( id, name ),
        roles:role_id ( id, name ),
        creator:created_by ( id, name, email )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch invitations for store ${storeId}: ${error.message}`);
      throw error;
    }

    return data || [];
  }

  async findById(id: string): Promise<StoreInvitationEntity | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data, error } = await client
      .from('store_invitations')
      .select(`
        *,
        stores:store_id ( id, name, organization_id ),
        roles:role_id ( id, name )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async findByTokenHashOrCode(tokenHashOrCode: string): Promise<any | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const query = client
      .from('store_invitations')
      .select(`
        *,
        stores:store_id ( id, name, organization_id ),
        roles:role_id ( id, name )
      `)
      .or(`token_hash.eq.${tokenHashOrCode},invitation_code.eq.${tokenHashOrCode}`);

    const res = typeof query.maybeSingle === 'function' ? await query.maybeSingle() : await query.single();
    return res?.data || null;
  }

  async findPendingByStoreAndEmail(storeId: string, email: string): Promise<StoreInvitationEntity | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const query = client
      .from('store_invitations')
      .select('*')
      .eq('store_id', storeId)
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'PENDING')
      .gt('expires_at', new Date().toISOString());

    const res = typeof query.maybeSingle === 'function' ? await query.maybeSingle() : await query.single();
    return res?.data || null;
  }

  async update(id: string, updates: Partial<StoreInvitationEntity>): Promise<StoreInvitationEntity> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return { id, ...updates } as StoreInvitationEntity;
    }

    const { data, error } = await client
      .from('store_invitations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Failed to update invitation ${id}: ${error.message}`);
      throw error;
    }

    return data;
  }

  async assignUserToStore(userId: string, storeId: string, roleId: string): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const { error } = await client
      .from('user_store_assignments')
      .upsert({
        user_id: userId,
        store_id: storeId,
        role_id: roleId,
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'user_id,store_id' });

    if (error) {
      this.logger.error(`Failed to assign user ${userId} to store ${storeId}: ${error.message}`);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<{ id: string; email: string; name: string; organization_id: string } | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data } = await client
      .from('users')
      .select('id, email, name, organization_id')
      .eq('email', email.toLowerCase().trim())
      .is('deleted_at', null)
      .maybeSingle();

    return data || null;
  }

  async getUserById(id: string): Promise<{ id: string; email: string; name: string; organization_id: string } | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data } = await client
      .from('users')
      .select('id, email, name, organization_id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    return data || null;
  }

  async getUserStoreAssignment(userId: string, storeId: string): Promise<{ id: string; role_id: string } | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data } = await client
      .from('user_store_assignments')
      .select('id, role_id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .maybeSingle();

    return data || null;
  }

  async getRoleByName(name: string): Promise<{ id: string; name: string } | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return { id: '01915dfa-9012-7000-8000-000000000005', name };
    }

    const { data } = await client
      .from('roles')
      .select('id, name')
      .eq('name', name)
      .single();

    return data || null;
  }

  async getStoreById(storeId: string): Promise<{ id: string; name: string; organization_id: string } | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return {
        id: storeId,
        name: 'Demo Restaurant',
        organization_id: '01915dfa-9012-7000-8000-000000000001',
      };
    }

    const { data } = await client
      .from('stores')
      .select('id, name, organization_id')
      .eq('id', storeId)
      .single();

    return data || null;
  }
}
