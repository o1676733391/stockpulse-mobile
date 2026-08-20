import { BaseEntity } from '../../common/entities/base.entity';

export class StoreEntity extends BaseEntity {
  organizationId!: string;
  storeCode!: string;
  name!: string;
  address?: string;
  city?: string;
  country!: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  currency!: string;
  timezone!: string;
  isActive!: boolean;
}
