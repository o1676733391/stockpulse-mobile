import { Injectable } from '@nestjs/common';
import {
  CreateSupplierDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { SuppliersRepository } from './suppliers.repository';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async findAll(storeId: string): Promise<SupplierResponseDto[]> {
    return this.suppliersRepository.findAll(storeId);
  }

  async findById(id: string, storeId: string): Promise<SupplierResponseDto | null> {
    return this.suppliersRepository.findById(id, storeId);
  }

  async create(dto: CreateSupplierDto, storeId: string): Promise<SupplierResponseDto> {
    return this.suppliersRepository.create(dto, storeId);
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    storeId: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliersRepository.update(id, dto, storeId);
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    return this.suppliersRepository.delete(id, storeId);
  }
}
