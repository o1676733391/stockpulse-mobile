import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateStoreDto,
  StoreResponseDto,
  UpdateStoreDto,
} from './dto/store.dto';
import { IStoreRepository } from './interfaces/store.repository.interface';

@Injectable()
export class StoresRepository implements IStoreRepository {
  private readonly logger = new Logger(StoresRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private mapStore(row: any): StoreResponseDto {
    return {
      id: row.id,
      organizationId: row.organization_id,
      storeCode: row.store_code,
      name: row.name,
      address: row.address || undefined,
      city: row.city || undefined,
      country: row.country || 'DE',
      postalCode: row.postal_code || undefined,
      phone: row.phone || undefined,
      email: row.email || undefined,
      currency: row.currency || 'EUR',
      timezone: row.timezone || 'Europe/Berlin',
      isActive: row.is_active !== false,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  async findById(id: string): Promise<StoreResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data, error } = await client
      .from('stores')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapStore(data);
  }

  async findByCode(
    storeCode: string,
    organizationId: string,
  ): Promise<StoreResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data, error } = await client
      .from('stores')
      .select('*')
      .eq('store_code', storeCode)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapStore(data);
  }

  async findByOrganization(organizationId: string): Promise<StoreResponseDto[]> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return [];

    const { data, error } = await client
      .from('stores')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error || !data) {
      this.logger.error(`Error finding stores by org: ${error?.message}`);
      return [];
    }

    return data.map((row: any) => this.mapStore(row));
  }

  async findAll(): Promise<StoreResponseDto[]> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return [];

    const { data, error } = await client
      .from('stores')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error || !data) {
      this.logger.error(`Error finding all stores: ${error?.message}`);
      return [];
    }

    return data.map((row: any) => this.mapStore(row));
  }

  async create(data: CreateStoreDto): Promise<StoreResponseDto> {
    this.logger.log(`StoresRepository.create: ${data.name} (${data.storeCode})`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    // Check duplicate store code in org
    const existing = await this.findByCode(data.storeCode, data.organizationId);
    if (existing) {
      throw new ConflictException(`Store with code '${data.storeCode}' already exists in this organization`);
    }

    const { data: storeData, error } = await client
      .from('stores')
      .insert({
        organization_id: data.organizationId,
        store_code: data.storeCode,
        name: data.name,
        address: data.address || null,
        city: data.city || null,
        country: data.country || 'DE',
        postal_code: data.postalCode || null,
        phone: data.phone || null,
        email: data.email || null,
        currency: data.currency || 'EUR',
        timezone: data.timezone || 'Europe/Berlin',
        is_active: true,
      })
      .select('*')
      .single();

    if (error || !storeData) {
      this.logger.error(`Error inserting store: ${error?.message}`);
      throw new InternalServerErrorException(error?.message || 'Failed to create store record');
    }

    return this.mapStore(storeData);
  }

  async update(id: string, data: UpdateStoreDto): Promise<StoreResponseDto> {
    this.logger.log(`StoresRepository.update: ${id}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Store with ID '${id}' not found`);
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.country !== undefined) updatePayload.country = data.country;
    if (data.postalCode !== undefined) updatePayload.postal_code = data.postalCode;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.currency !== undefined) updatePayload.currency = data.currency;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;

    const { data: updatedData, error } = await client
      .from('stores')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updatedData) {
      this.logger.error(`Error updating store ${id}: ${error?.message}`);
      throw new InternalServerErrorException(error?.message || 'Failed to update store');
    }

    return this.mapStore(updatedData);
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log(`StoresRepository.delete: ${id}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Store with ID '${id}' not found`);
    }

    const now = new Date().toISOString();
    const { error } = await client
      .from('stores')
      .update({
        is_active: false,
        deleted_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deactivating store ${id}: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    return true;
  }
}
