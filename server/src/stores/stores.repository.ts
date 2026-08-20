import { Injectable, Logger } from '@nestjs/common';
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

  async findById(id: string): Promise<StoreResponseDto | null> {
    this.logger.log(`StoresRepository.findById: ${id}`);
    return null;
  }

  async findByCode(
    storeCode: string,
    organizationId: string,
  ): Promise<StoreResponseDto | null> {
    this.logger.log(`StoresRepository.findByCode: ${storeCode} for ${organizationId}`);
    return null;
  }

  async findByOrganization(organizationId: string): Promise<StoreResponseDto[]> {
    this.logger.log(`StoresRepository.findByOrganization: ${organizationId}`);
    return [];
  }

  async findAll(): Promise<StoreResponseDto[]> {
    return [];
  }

  async create(data: CreateStoreDto): Promise<StoreResponseDto> {
    this.logger.log(`StoresRepository.create: ${data.name}`);
    return {
      id: '01915dfa-9012-7000-8000-000000000002',
      organizationId: data.organizationId,
      storeCode: data.storeCode,
      name: data.name,
      address: data.address,
      currency: data.currency || 'EUR',
      timezone: data.timezone || 'Europe/Berlin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async update(id: string, data: UpdateStoreDto): Promise<StoreResponseDto> {
    this.logger.log(`StoresRepository.update: ${id}`);
    return {
      id,
      organizationId: '01915dfa-9012-7000-8000-000000000001',
      storeCode: 'STR-BER-01',
      name: data.name || 'Store',
      address: data.address,
      currency: data.currency || 'EUR',
      timezone: data.timezone || 'Europe/Berlin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log(`StoresRepository.delete: ${id}`);
    return true;
  }
}
