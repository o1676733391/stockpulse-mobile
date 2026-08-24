export type UserRole = 'admin' | 'manager' | 'supervisor' | 'staff' | 'auditor';

export type Permission =
  // Master Inventory
  | 'inventory:view'
  | 'inventory:view_costs'
  | 'inventory:manage_skus'
  | 'inventory:edit' // Alias for inventory:manage_skus
  | 'inventory:adjust'
  // Stock Counts & Audits
  | 'stock_count:conduct'
  | 'inventory:count' // Alias for stock_count:conduct
  | 'stock_count:approve'
  | 'inventory:audit_approve' // Alias for stock_count:approve
  // POS & OCR AI
  | 'ocr:scan'
  | 'pos:scan' // Alias for ocr:scan
  | 'ocr:review'
  | 'pos:ocr_review' // Alias for ocr:review
  | 'ocr:confirm'
  | 'pos:bom_deduct' // Alias for ocr:confirm
  // Expiration & Waste
  | 'bbd:view'
  | 'bbd:action_waste'
  // Procurement & Orders
  | 'procurement:view_poq'
  | 'procurement:create_po'
  | 'procurement:submit_po' // Alias for procurement:create_po
  | 'procurement:approve_po'
  | 'procurement:goods_receipt'
  // Analytics & Reports
  | 'analytics:view'
  | 'analytics:view_financials'
  | 'analytics:export_reports'
  // Team & Administration
  | 'team:view'
  | 'team:manage'
  | 'settings:view'
  | 'settings:manage_store'
  // Audit Ledger
  | 'audit:view';

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
