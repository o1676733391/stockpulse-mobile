import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateSupplierDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { ISupplierRepository } from './interfaces/supplier.repository.interface';

@Injectable()
export class SuppliersRepository implements ISupplierRepository {
  private readonly logger = new Logger(SuppliersRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string, storeId?: string): Promise<SupplierResponseDto | null> {
    this.logger.log(`SuppliersRepository.findById: ${id} in store: ${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id,
        storeId: storeId || 'store-01',
        supplierCode: 'SUP-001',
        name: 'Fresh Dairy Supplies',
        contactName: 'John Miller',
        email: 'john@freshdairy.com',
        phone: '+1 555-0199',
        leadTimeDays: 2,
        paymentTerms: 'Net 30',
        createdAt: new Date().toISOString(),
      };
    }

    let query = client
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.single();
    if (error || !data) return null;

    return this.mapRowToDto(data);
  }

  async findByCode(
    supplierCode: string,
    storeId: string,
  ): Promise<SupplierResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data } = await client
      .from('suppliers')
      .select('*')
      .eq('supplier_code', supplierCode.trim().toUpperCase())
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    return data ? this.mapRowToDto(data) : null;
  }

  async findAll(storeId?: string): Promise<SupplierResponseDto[]> {
    this.logger.log(`SuppliersRepository.findAll for store: ${storeId}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return [
        {
          id: '01915dfa-b1c4-7221-9988-000000000055',
          storeId: storeId || 'store-01',
          supplierCode: 'SUP-001',
          name: 'Fresh Dairy Supplies',
          contactName: 'John Miller',
          email: 'john@freshdairy.com',
          phone: '+1 555-0199',
          leadTimeDays: 2,
          paymentTerms: 'Net 30',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    let query = client
      .from('suppliers')
      .select('*')
      .is('deleted_at', null);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) {
      this.logger.error(`Failed to list suppliers: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve suppliers');
    }

    return (data || []).map((row: any) => this.mapRowToDto(row));
  }

  async create(
    data: CreateSupplierDto,
    storeId?: string,
  ): Promise<SupplierResponseDto> {
    this.logger.log(`SuppliersRepository.create: ${data.name}`);
    const client = this.supabaseService.getAdminClient();

    const targetStoreId = storeId || '01915dfa-9012-7000-8000-000000000002';
    const codeUpper = data.supplierCode.trim().toUpperCase();

    if (!client) {
      return {
        id: '01915dfa-b1c4-7221-9988-000000000055',
        storeId: targetStoreId,
        supplierCode: codeUpper,
        name: data.name,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        leadTimeDays: data.leadTimeDays || 1,
        paymentTerms: data.paymentTerms,
        createdAt: new Date().toISOString(),
      };
    }

    const existing = await this.findByCode(codeUpper, targetStoreId);
    if (existing) {
      throw new ConflictException(`Supplier with code '${codeUpper}' already exists in store`);
    }

    const { data: created, error } = await client
      .from('suppliers')
      .insert({
        store_id: targetStoreId,
        supplier_code: codeUpper,
        name: data.name.trim(),
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        lead_time_days: data.leadTimeDays || 1,
        payment_terms: data.paymentTerms,
      })
      .select('*')
      .single();

    if (error || !created) {
      this.logger.error(`Failed to create supplier: ${error?.message}`);
      throw new InternalServerErrorException('Failed to create supplier');
    }

    return this.mapRowToDto(created);
  }

  async update(
    id: string,
    data: UpdateSupplierDto,
    storeId?: string,
  ): Promise<SupplierResponseDto> {
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return {
        id,
        storeId: storeId || 'store-01',
        supplierCode: 'SUP-001',
        name: data.name || 'Updated Supplier',
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        leadTimeDays: data.leadTimeDays || 1,
        paymentTerms: data.paymentTerms,
        createdAt: new Date().toISOString(),
      };
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.contactName !== undefined) payload.contact_name = data.contactName;
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.leadTimeDays !== undefined) payload.lead_time_days = data.leadTimeDays;
    if (data.paymentTerms !== undefined) payload.payment_terms = data.paymentTerms;

    let query = client
      .from('suppliers')
      .update(payload)
      .eq('id', id);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: updated, error } = await query.select('*').single();

    if (error || !updated) {
      this.logger.error(`Failed to update supplier: ${error?.message}`);
      throw new InternalServerErrorException('Failed to update supplier');
    }

    return this.mapRowToDto(updated);
  }

  async delete(id: string, storeId?: string): Promise<boolean> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return true;

    let query = client
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { error } = await query;
    return !error;
  }

  private mapRowToDto(row: any): SupplierResponseDto {
    return {
      id: row.id,
      storeId: row.store_id,
      supplierCode: row.supplier_code,
      name: row.name,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      leadTimeDays: Number(row.lead_time_days || 1),
      paymentTerms: row.payment_terms,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }
}
