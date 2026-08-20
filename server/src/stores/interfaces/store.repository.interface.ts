import { IBaseRepository } from '../../database/base.repository.interface';
import {
  CreateStoreDto,
  StoreResponseDto,
  UpdateStoreDto,
} from '../dto/store.dto';

export interface IStoreRepository
  extends IBaseRepository<StoreResponseDto, CreateStoreDto, UpdateStoreDto> {
  findByCode(storeCode: string, organizationId: string): Promise<StoreResponseDto | null>;
  findByOrganization(organizationId: string): Promise<StoreResponseDto[]>;
}
