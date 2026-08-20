import { BaseEntity } from '../../common/entities/base.entity';

export type PlanTier = 'trial' | 'starter' | 'pro' | 'enterprise';

export class OrganizationEntity extends BaseEntity {
  name!: string;
  slug!: string;
  taxIdentifier?: string;
  planTier!: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
