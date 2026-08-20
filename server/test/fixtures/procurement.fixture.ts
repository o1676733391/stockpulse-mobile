import { TEST_STORE_ID } from './auth.fixture';

export const TEST_SUPPLIER = {
  id: '01915dfa-b1c4-7221-9988-51b72e04e020',
  storeId: TEST_STORE_ID,
  supplierCode: 'SUP-001',
  name: 'Fresh Farms Direct',
  leadTimeDays: 2,
  paymentTerms: 'Net 30',
};

export const TEST_CREATE_PO_DTO = {
  supplierId: TEST_SUPPLIER.id,
  orderDate: '2026-08-20',
  expectedDeliveryDate: '2026-08-22',
  items: [
    {
      itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
      quantityOrdered: 40,
      unit: 'L',
      unitPrice: 1.25,
    },
  ],
  notes: 'Regular stock replenishment',
};
