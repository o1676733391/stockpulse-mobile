export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
  organizationName?: string;
  role: 'superadmin' | 'manager' | 'supervisor' | 'staff' | 'auditor' | string;
  permissions: string[];
  assignedStoreIds: string[];
  defaultStoreId?: string;
  currentStoreId?: string;
}
