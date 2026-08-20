import { IBaseRepository } from '../../database/base.repository.interface';
import {
  CreateSupplierDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from '../dto/supplier.dto';

export interface ISupplierRepository
  extends IBaseRepository<
    SupplierResponseDto,
    CreateSupplierDto,
    UpdateSupplierDto
  > {
  findByCode(
    supplierCode: string,
    storeId: string,
  ): Promise<SupplierResponseDto | null>;
}
