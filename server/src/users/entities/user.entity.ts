import { BaseEntity } from '../../common/entities/base.entity';

export class UserEntity extends BaseEntity {
  organizationId!: string;
  email!: string;
  name!: string;
  phone?: string;
  avatarUrl?: string;
  defaultStoreId?: string;
  isActive!: boolean;
}
