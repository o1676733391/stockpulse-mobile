import { BadgeVariant } from '@/constants/theme';

export type UserRole = 'admin' | 'manager' | 'staff';
export type StockStatus = 'healthy' | 'low' | 'critical' | 'overstock';
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok';
export type Urgency = 'critical' | 'warning';

export interface Batch {
  id: string;
  quantity: number;
  expiryDate: string;
  daysRemaining: number;
}

export interface Transaction {
  id: string;
  type: 'pos_deduction' | 'manual_count' | 'goods_receipt' | 'adjustment';
  date: string;
  user: string;
  delta: number;
  note?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  physicalStock: number;
  theoreticalStock: number;
  targetStock: number;
  safetyStock: number;
  costPerUnit: number;
  supplierId: string;
  status: StockStatus;
  batches: Batch[];
  transactions: Transaction[];
  storageArea?: string;
  shelfLifeDays?: number;
  barcode?: string;
}

export interface DashboardTask {
  id: string;
  label: string;
  sub: string;
  iconName: string;
  color: string;
  bg: string;
  done?: number;
  total?: number;
  badge?: string;
  badgeVariant?: BadgeVariant;
  route: string;
}

export interface DashboardExpiryItem {
  id: string;
  name: string;
  qty: string;
  exp: string;
  days: number;
  urgency: Urgency;
  value: string;
}

export interface DashboardActivityItem {
  id: string;
  iconName: string;
  label: string;
  sub: string;
  time: string;
  dotColor: string;
}

export interface DashboardKpi {
  label: string;
  value: string;
  sub: string;
  variant: BadgeVariant;
  trend: {
    dir: 'up' | 'down' | 'flat';
    label: string;
  };
}

export interface StockHealthSegment {
  label: string;
  count: number;
  pct: number;
  color: string;
  bg: string;
}

export interface QuickAction {
  id: string;
  label: string;
  iconName: string;
  iconColor: string;
  bg: string;
  route: string;
}

export interface CountSchedule {
  id: string;
  label: string;
  sub: string;
  progress: number;
  total: number;
  status: 'in_progress' | 'scheduled';
  route: string;
}

export interface StockCountItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  expected: number;
  category: string;
}

export interface CountSummaryItem {
  id: string;
  name: string;
  should: number;
  is: number;
  unit: string;
  cost: number;
}
