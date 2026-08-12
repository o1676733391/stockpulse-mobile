export type Platform = 'ios' | 'android'
export type UserRole = 'admin' | 'manager' | 'staff'

export type Screen =
  | 'splash' | 'welcome' | 'login' | 'onboarding'
  | 'home' | 'notifications'
  | 'inventory' | 'inventory-detail'
  | 'stock-count' | 'active-count' | 'count-summary'
  | 'scan' | 'ocr-processing' | 'ocr-review' | 'ocr-result'
  | 'orders' | 'poq' | 'purchase-order'
  | 'more'
  | 'recipes' | 'recipe-detail' | 'create-recipe' | 'edit-recipe'
  | 'expiration' | 'expiration-item' | 'waste-reduction'
  | 'goods-receipts' | 'new-receipt'
  | 'suppliers' | 'supplier-detail'
  | 'reports' | 'archive' | 'audit-log'
  | 'team' | 'settings'
  | 'forgot-password' | 'add-member' | 'member-detail' | 'role-editor' | 'super-admin'

export type StockStatus = 'healthy' | 'low' | 'critical' | 'overstock'
export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok'
export type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'received'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  physicalStock: number
  theoreticalStock: number
  targetStock: number
  safetyStock: number
  costPerUnit: number
  supplierId: string
  status: StockStatus
  batches: Batch[]
  transactions: Transaction[]
}

export interface Batch {
  id: string
  quantity: number
  expiryDate: string
  daysRemaining: number
}

export interface Transaction {
  id: string
  type: 'pos_deduction' | 'manual_count' | 'goods_receipt' | 'adjustment'
  date: string
  user: string
  delta: number
  note?: string
}

export interface Recipe {
  id: string
  name: string
  category: string
  costPerServing: number
  active: boolean
  ingredients: RecipeIngredient[]
}

export interface RecipeIngredient {
  itemId: string
  itemName: string
  quantity: number
  unit: string
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  ingredientCount: number
  openOrders: number
  lastDelivery: string
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  date: string
  status: OrderStatus
  items: POItem[]
  total: number
}

export interface POItem {
  itemId: string
  itemName: string
  quantity: number
  unit: string
  pricePerUnit: number
}

export interface GoodsReceipt {
  id: string
  supplierId: string
  supplierName: string
  invoiceNumber: string
  date: string
  items: GRItem[]
  total: number
  status: 'pending' | 'received'
}

export interface GRItem {
  itemName: string
  quantity: number
  unit: string
  pricePerUnit: number
  bbd: string
}

export interface Notification {
  id: string
  type: 'expiry' | 'low_stock' | 'variance' | 'count_due' | 'ocr_complete' | 'po_recommendation' | 'goods_received'
  title: string
  body: string
  time: string
  read: boolean
  urgent: boolean
}

export interface AuditEvent {
  id: string
  user: string
  action: string
  item: string
  delta: string
  timestamp: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole | 'owner'
  status: 'active' | 'inactive'
  lastActive: string
  avatar: string
}

export interface AppState {
  platform: Platform
  role: UserRole
  screen: Screen
  screenStack: Screen[]
  params: Record<string, unknown>
}
