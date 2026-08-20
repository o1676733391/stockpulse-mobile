import { Injectable } from '@nestjs/common';
import {
  CreateStoreDto,
  StoreResponseDto,
  UpdateStoreDto,
} from './dto/store.dto';
import { StoresRepository } from './stores.repository';

@Injectable()
export class StoresService {
  constructor(private readonly storesRepository: StoresRepository) {}

  async findById(id: string): Promise<StoreResponseDto | null> {
    return this.storesRepository.findById(id);
  }

  async findByOrganization(organizationId: string): Promise<StoreResponseDto[]> {
    return this.storesRepository.findByOrganization(organizationId);
  }

  async create(dto: CreateStoreDto): Promise<StoreResponseDto> {
    return this.storesRepository.create(dto);
  }

  async update(id: string, dto: UpdateStoreDto): Promise<StoreResponseDto> {
    return this.storesRepository.update(id, dto);
  }
}
