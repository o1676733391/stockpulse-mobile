import { BaseEntity } from '../../common/entities/base.entity';

export class StoreSettingsEntity extends BaseEntity {
  storeId!: string;
  defaultTaxRate!: number;
  reducedTaxRate!: number;
  safetyStockMultiplier!: number;
  blindCountEnabled!: boolean;
  varianceThresholdWarningEur!: number;
  varianceThresholdCriticalEur!: number;
  operatingHours?: Record<string, { open: string; close: string }>;
}
