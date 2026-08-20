export const TEST_ORG_ID = '01915dfa-9012-7000-8000-000000000001';
export const TEST_STORE_ID = '01915dfa-9012-7000-8000-000000000002';
export const TEST_OTHER_STORE_ID = '01915dfa-9012-7000-8000-000000000003';

export const TEST_USER_MANAGER = {
  id: '01915dfa-b1c4-7221-9988-51b72e04e001',
  email: 'mario.manager@stockpulse.app',
  name: 'Mario Batali',
  role: 'manager',
  organizationId: TEST_ORG_ID,
  assignedStoreIds: [TEST_STORE_ID],
  permissions: [
    'inventory:view',
    'inventory:create',
    'inventory:update',
    'inventory:adjust',
    'procurement:view',
    'procurement:create',
    'procurement:approve',
    'procurement:receive',
    'ocr:view',
    'ocr:upload',
    'ocr:confirm',
    'notifications:view',
    'notifications:send',
    'audit:view',
  ],
};

export const TEST_USER_STAFF = {
  id: '01915dfa-b1c4-7221-9988-51b72e04e002',
  email: 'luigi.staff@stockpulse.app',
  name: 'Luigi Mario',
  role: 'staff',
  organizationId: TEST_ORG_ID,
  assignedStoreIds: [TEST_STORE_ID],
  permissions: ['inventory:view', 'procurement:view', 'notifications:view'],
};

export const MOCK_VALID_JWT = 'mock.jwt.token.for.test';
