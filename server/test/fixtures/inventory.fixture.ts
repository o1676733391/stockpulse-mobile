import { TEST_STORE_ID } from './auth.fixture';

export const TEST_INVENTORY_ITEM = {
  id: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
  storeId: TEST_STORE_ID,
  sku: 'DAI-001',
  name: 'Whole Milk 3.5% (1L)',
  unit: 'L',
  physicalStock: 25.0,
  theoreticalStock: 25.0,
  targetStock: 40.0,
  safetyStock: 10.0,
  costPerUnit: 1.25,
  totalValue: 31.25,
  status: 'healthy',
  version: 1,
  isArchived: false,
};

export const TEST_CREATE_ITEM_DTO = {
  sku: 'DAI-002',
  name: 'Heavy Cream 36% (1L)',
  unit: 'L',
  targetStock: 20,
  safetyStock: 5,
  costPerUnit: 3.5,
};
