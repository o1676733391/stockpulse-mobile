export type UserRole = 'admin' | 'manager' | 'supervisor' | 'staff' | 'auditor';

export type Permission =
  // Inventory
  | 'inventory:view'
  | 'inventory:view_costs'
  | 'inventory:edit'
  | 'inventory:count'
  | 'inventory:audit_approve'
  // POS & OCR
  | 'pos:scan'
  | 'pos:ocr_review'
  | 'pos:bom_deduct'
  // Expiration & Waste
  | 'bbd:view'
  | 'bbd:action_waste'
  // Procurement & Orders
  | 'procurement:view_poq'
  | 'procurement:create_po'
  | 'procurement:submit_po'
  | 'procurement:goods_receipt'
  // Analytics & Reports
  | 'analytics:view'
  | 'analytics:view_financials'
  | 'analytics:export_reports'
  // Team & Administration
  | 'team:view'
  | 'team:manage'
  | 'settings:view'
  | 'settings:manage_store';

export interface RoleDefinition {
  key: UserRole;
  label: string;
  description: string;
  badgeVariant: 'purple' | 'blue' | 'amber' | 'gray' | 'green';
  color: string;
  bg: string;
  permissions: Permission[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarText: string;
  role: UserRole;
  storeId: string;
  storeName: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface ModulePermissionRow {
  module: string;
  description: string;
  permission: Permission;
  admin: 'full' | 'view' | 'none';
  manager: 'full' | 'view' | 'none';
  supervisor: 'full' | 'view' | 'none';
  staff: 'full' | 'view' | 'none';
  auditor: 'full' | 'view' | 'none';
}
