import { BaseEntity } from '../../common/entities/base.entity';

export class SupplierEntity extends BaseEntity {
  storeId!: string;
  supplierCode!: string;
  name!: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTimeDays!: number;
  paymentTerms?: string;
}
