import type { InventoryItem, Recipe, Supplier, PurchaseOrder, GoodsReceipt, Notification, AuditEvent, TeamMember } from '../types'

export const inventoryItems: InventoryItem[] = [
  {
    id: 'i1', name: 'Chicken Breast', sku: 'CHK-001', category: 'Meat & Poultry',
    unit: 'kg', physicalStock: 24.5, theoreticalStock: 27.0, targetStock: 35, safetyStock: 5,
    costPerUnit: 4.80, supplierId: 's1', status: 'low',
    batches: [
      { id: 'B1024', quantity: 10, expiryDate: '14 Mar 2026', daysRemaining: 3 },
      { id: 'B1029', quantity: 14.5, expiryDate: '21 Mar 2026', daysRemaining: 10 },
    ],
    transactions: [
      { id: 't1', type: 'pos_deduction', date: '10 Mar 18:30', user: 'System', delta: -3.8, note: 'POS Report #2048' },
      { id: 't2', type: 'manual_count', date: '10 Mar 10:00', user: 'Anna Schmidt', delta: 0, note: 'Daily count' },
      { id: 't3', type: 'goods_receipt', date: '08 Mar 09:00', user: 'Marco Bauer', delta: 20, note: 'GR-20481' },
      { id: 't4', type: 'adjustment', date: '07 Mar 14:00', user: 'Anna Schmidt', delta: -2.5, note: 'Spoilage' },
    ]
  },
  {
    id: 'i2', name: 'Fresh Salmon', sku: 'SAL-002', category: 'Fish & Seafood',
    unit: 'kg', physicalStock: 4.2, theoreticalStock: 6.0, targetStock: 10, safetyStock: 2,
    costPerUnit: 16.20, supplierId: 's2', status: 'critical',
    batches: [
      { id: 'B1030', quantity: 4.2, expiryDate: '11 Mar 2026', daysRemaining: 1 },
    ],
    transactions: [
      { id: 't5', type: 'pos_deduction', date: '10 Mar 18:30', user: 'System', delta: -1.8, note: 'POS Report #2048' },
      { id: 't6', type: 'goods_receipt', date: '09 Mar 08:00', user: 'Marco Bauer', delta: 6, note: 'GR-20479' },
    ]
  },
  {
    id: 'i3', name: 'Potatoes', sku: 'POT-003', category: 'Vegetables',
    unit: 'kg', physicalStock: 48.0, theoreticalStock: 50.2, targetStock: 80, safetyStock: 10,
    costPerUnit: 0.90, supplierId: 's1', status: 'low',
    batches: [
      { id: 'B1021', quantity: 48, expiryDate: '30 Mar 2026', daysRemaining: 19 },
    ],
    transactions: [
      { id: 't7', type: 'pos_deduction', date: '10 Mar 18:30', user: 'System', delta: -8.2, note: 'POS Report #2048' },
    ]
  },
  {
    id: 'i4', name: 'Cooking Oil', sku: 'OIL-004', category: 'Dry Goods',
    unit: 'L', physicalStock: 22.5, theoreticalStock: 24.0, targetStock: 30, safetyStock: 5,
    costPerUnit: 2.40, supplierId: 's1', status: 'healthy',
    batches: [
      { id: 'B1018', quantity: 22.5, expiryDate: '15 Jun 2026', daysRemaining: 96 },
    ],
    transactions: []
  },
  {
    id: 'i5', name: 'Whole Milk', sku: 'MLK-005', category: 'Dairy',
    unit: 'L', physicalStock: 8.0, theoreticalStock: 10.5, targetStock: 20, safetyStock: 4,
    costPerUnit: 1.10, supplierId: 's3', status: 'low',
    batches: [
      { id: 'B1032', quantity: 8, expiryDate: '13 Mar 2026', daysRemaining: 3 },
    ],
    transactions: []
  },
  {
    id: 'i6', name: 'Gouda Cheese', sku: 'CHS-006', category: 'Dairy',
    unit: 'kg', physicalStock: 6.8, theoreticalStock: 7.2, targetStock: 10, safetyStock: 2,
    costPerUnit: 8.50, supplierId: 's3', status: 'healthy',
    batches: [
      { id: 'B1031', quantity: 6.8, expiryDate: '25 Apr 2026', daysRemaining: 45 },
    ],
    transactions: []
  },
  {
    id: 'i7', name: 'Tomatoes', sku: 'TOM-007', category: 'Vegetables',
    unit: 'kg', physicalStock: 12.4, theoreticalStock: 14.0, targetStock: 20, safetyStock: 3,
    costPerUnit: 1.80, supplierId: 's2', status: 'healthy',
    batches: [
      { id: 'B1028', quantity: 12.4, expiryDate: '16 Mar 2026', daysRemaining: 6 },
    ],
    transactions: []
  },
  {
    id: 'i8', name: 'Romaine Lettuce', sku: 'LET-008', category: 'Vegetables',
    unit: 'kg', physicalStock: 3.1, theoreticalStock: 4.0, targetStock: 8, safetyStock: 1.5,
    costPerUnit: 2.20, supplierId: 's2', status: 'low',
    batches: [
      { id: 'B1033', quantity: 3.1, expiryDate: '12 Mar 2026', daysRemaining: 2 },
    ],
    transactions: []
  },
  {
    id: 'i9', name: 'Ground Beef', sku: 'BEF-009', category: 'Meat & Poultry',
    unit: 'kg', physicalStock: 18.0, theoreticalStock: 18.0, targetStock: 25, safetyStock: 4,
    costPerUnit: 6.20, supplierId: 's1', status: 'healthy',
    batches: [
      { id: 'B1027', quantity: 18, expiryDate: '13 Mar 2026', daysRemaining: 3 },
    ],
    transactions: []
  },
  {
    id: 'i10', name: 'Wheat Flour', sku: 'FLR-010', category: 'Dry Goods',
    unit: 'kg', physicalStock: 95.0, theoreticalStock: 95.0, targetStock: 80, safetyStock: 10,
    costPerUnit: 0.65, supplierId: 's1', status: 'overstock',
    batches: [
      { id: 'B1020', quantity: 95, expiryDate: '31 Aug 2026', daysRemaining: 173 },
    ],
    transactions: []
  },
]

export const recipes: Recipe[] = [
  {
    id: 'r1', name: 'Menu 1 — Chicken Plate', category: 'Main Course',
    costPerServing: 3.42, active: true,
    ingredients: [
      { itemId: 'i1', itemName: 'Chicken Breast', quantity: 0.20, unit: 'kg' },
      { itemId: 'i3', itemName: 'Potatoes', quantity: 0.15, unit: 'kg' },
      { itemId: 'i4', itemName: 'Cooking Oil', quantity: 0.02, unit: 'L' },
      { itemId: 'i7', itemName: 'Tomatoes', quantity: 0.05, unit: 'kg' },
    ]
  },
  {
    id: 'r2', name: 'Burger XL', category: 'Burgers',
    costPerServing: 4.18, active: true,
    ingredients: [
      { itemId: 'i9', itemName: 'Ground Beef', quantity: 0.25, unit: 'kg' },
      { itemId: 'i8', itemName: 'Romaine Lettuce', quantity: 0.04, unit: 'kg' },
      { itemId: 'i7', itemName: 'Tomatoes', quantity: 0.06, unit: 'kg' },
      { itemId: 'i6', itemName: 'Gouda Cheese', quantity: 0.04, unit: 'kg' },
    ]
  },
  {
    id: 'r3', name: 'Salmon Lunch Special', category: 'Fish',
    costPerServing: 8.90, active: true,
    ingredients: [
      { itemId: 'i2', itemName: 'Fresh Salmon', quantity: 0.22, unit: 'kg' },
      { itemId: 'i3', itemName: 'Potatoes', quantity: 0.12, unit: 'kg' },
      { itemId: 'i7', itemName: 'Tomatoes', quantity: 0.05, unit: 'kg' },
      { itemId: 'i4', itemName: 'Cooking Oil', quantity: 0.02, unit: 'L' },
    ]
  },
  {
    id: 'r4', name: 'Menu 3 — Mixed Salad', category: 'Salads',
    costPerServing: 2.10, active: true,
    ingredients: [
      { itemId: 'i8', itemName: 'Romaine Lettuce', quantity: 0.12, unit: 'kg' },
      { itemId: 'i7', itemName: 'Tomatoes', quantity: 0.08, unit: 'kg' },
      { itemId: 'i6', itemName: 'Gouda Cheese', quantity: 0.05, unit: 'kg' },
    ]
  },
  {
    id: 'r5', name: 'Classic Pancakes', category: 'Breakfast',
    costPerServing: 1.85, active: false,
    ingredients: [
      { itemId: 'i10', itemName: 'Wheat Flour', quantity: 0.10, unit: 'kg' },
      { itemId: 'i5', itemName: 'Whole Milk', quantity: 0.15, unit: 'L' },
      { itemId: 'i4', itemName: 'Cooking Oil', quantity: 0.01, unit: 'L' },
    ]
  },
]

export const suppliers: Supplier[] = [
  { id: 's1', name: 'Metro Foods GmbH', contact: 'Klaus Weber', phone: '+49 30 1234 5678', email: 'orders@metrofoods.de', ingredientCount: 24, openOrders: 1, lastDelivery: '08 Mar 2026' },
  { id: 's2', name: 'FreshProduce GmbH', contact: 'Lena Müller', phone: '+49 89 9876 5432', email: 'lena@freshproduce.de', ingredientCount: 12, openOrders: 0, lastDelivery: '09 Mar 2026' },
  { id: 's3', name: 'Alpine Dairy Co.', contact: 'Hans Berger', phone: '+43 1 555 0123', email: 'h.berger@alpinedairy.at', ingredientCount: 8, openOrders: 2, lastDelivery: '07 Mar 2026' },
]

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1', supplierId: 's1', supplierName: 'Metro Foods GmbH',
    date: '10 Mar 2026', status: 'sent', total: 248.40,
    items: [
      { itemId: 'i1', itemName: 'Chicken Breast', quantity: 15.5, unit: 'kg', pricePerUnit: 4.80 },
      { itemId: 'i3', itemName: 'Potatoes', quantity: 30, unit: 'kg', pricePerUnit: 0.90 },
      { itemId: 'i4', itemName: 'Cooking Oil', quantity: 10, unit: 'L', pricePerUnit: 2.40 },
    ]
  },
  {
    id: 'po2', supplierId: 's3', supplierName: 'Alpine Dairy Co.',
    date: '09 Mar 2026', status: 'confirmed', total: 114.60,
    items: [
      { itemId: 'i5', itemName: 'Whole Milk', quantity: 40, unit: 'L', pricePerUnit: 1.10 },
      { itemId: 'i6', itemName: 'Gouda Cheese', quantity: 8, unit: 'kg', pricePerUnit: 8.50 },
    ]
  },
  {
    id: 'po3', supplierId: 's2', supplierName: 'FreshProduce GmbH',
    date: '08 Mar 2026', status: 'draft', total: 78.00,
    items: [
      { itemId: 'i2', itemName: 'Fresh Salmon', quantity: 6, unit: 'kg', pricePerUnit: 16.20 },
    ]
  },
]

export const goodsReceipts: GoodsReceipt[] = [
  {
    id: 'gr1', supplierId: 's1', supplierName: 'Metro Foods GmbH',
    invoiceNumber: 'INV-20481', date: '08 Mar 2026',
    total: 842.50, status: 'received',
    items: [
      { itemName: 'Chicken Breast', quantity: 20, unit: 'kg', pricePerUnit: 4.80, bbd: '18 Mar 2026' },
      { itemName: 'Potatoes', quantity: 50, unit: 'kg', pricePerUnit: 0.90, bbd: '30 Mar 2026' },
      { itemName: 'Cooking Oil', quantity: 15, unit: 'L', pricePerUnit: 2.40, bbd: '15 Jun 2026' },
    ]
  },
  {
    id: 'gr2', supplierId: 's2', supplierName: 'FreshProduce GmbH',
    invoiceNumber: 'INV-20479', date: '09 Mar 2026',
    total: 142.30, status: 'received',
    items: [
      { itemName: 'Fresh Salmon', quantity: 6, unit: 'kg', pricePerUnit: 16.20, bbd: '13 Mar 2026' },
      { itemName: 'Tomatoes', quantity: 15, unit: 'kg', pricePerUnit: 1.80, bbd: '16 Mar 2026' },
    ]
  },
]

export const notifications: Notification[] = [
  { id: 'n1', type: 'expiry', title: 'Critical Expiry', body: 'Fresh Salmon expires tomorrow. 4.2 kg / €68 at risk.', time: '2 min ago', read: false, urgent: true },
  { id: 'n2', type: 'expiry', title: 'Expiry Warning', body: 'Romaine Lettuce expires in 2 days. 3.1 kg / €6.82 at risk.', time: '15 min ago', read: false, urgent: true },
  { id: 'n3', type: 'low_stock', title: 'Low Stock Alert', body: 'Whole Milk is below safety stock. 8 L remaining.', time: '1 hr ago', read: false, urgent: false },
  { id: 'n4', type: 'variance', title: 'Major Variance Detected', body: 'Chicken Breast shows -9.3% variance. Review required.', time: '2 hr ago', read: false, urgent: false },
  { id: 'n5', type: 'count_due', title: 'Stock Count Due', body: 'Daily stock count is scheduled for today.', time: '6 hr ago', read: true, urgent: false },
  { id: 'n6', type: 'ocr_complete', title: 'POS Scan Processed', body: 'Report #2048 processed. 24 items detected, 94% confidence.', time: '8 hr ago', read: true, urgent: false },
  { id: 'n7', type: 'po_recommendation', title: 'Reorder Recommendations', body: '4 items need reordering. Review POQ recommendations.', time: '10 hr ago', read: true, urgent: false },
  { id: 'n8', type: 'goods_received', title: 'Goods Receipt Confirmed', body: 'GR-20481 from Metro Foods GmbH confirmed. 18 items added.', time: 'Yesterday', read: true, urgent: false },
]

export const auditLog: AuditEvent[] = [
  { id: 'a1', user: 'Anna Schmidt', action: 'Stock Adjustment', item: 'Chicken Breast', delta: '-2.5 kg', timestamp: '10 Mar 2026, 18:42' },
  { id: 'a2', user: 'System (OCR)', action: 'POS Deduction', item: '5 ingredients', delta: 'Multiple', timestamp: '10 Mar 2026, 18:30' },
  { id: 'a3', user: 'Marco Bauer', action: 'Goods Receipt', item: 'GR-20481', delta: '+18 items', timestamp: '08 Mar 2026, 09:14' },
  { id: 'a4', user: 'Anna Schmidt', action: 'Stock Count Completed', item: 'Daily Count', delta: '68 items', timestamp: '08 Mar 2026, 11:02' },
  { id: 'a5', user: 'Lena Fischer', action: 'Recipe Updated', item: 'Menu 1 — Chicken Plate', delta: 'Ingredient qty changed', timestamp: '07 Mar 2026, 14:30' },
  { id: 'a6', user: 'Marco Bauer', action: 'Purchase Order Created', item: 'PO-20481', delta: '€248.40', timestamp: '06 Mar 2026, 16:55' },
  { id: 'a7', user: 'Anna Schmidt', action: 'User Invited', item: 'New Staff Member', delta: 'Role: Staff', timestamp: '05 Mar 2026, 10:00' },
  { id: 'a8', user: 'System', action: 'Expiry Alert Triggered', item: 'Fresh Salmon', delta: '1 day remaining', timestamp: '10 Mar 2026, 07:00' },
]

export const team: TeamMember[] = [
  { id: 'm1', name: 'Anna Schmidt', email: 'anna@restaurant.de', role: 'owner', status: 'active', lastActive: 'Now', avatar: 'AS' },
  { id: 'm2', name: 'Marco Bauer', email: 'marco@restaurant.de', role: 'manager', status: 'active', lastActive: '2 hr ago', avatar: 'MB' },
  { id: 'm3', name: 'Lena Fischer', email: 'lena@restaurant.de', role: 'manager', status: 'active', lastActive: 'Yesterday', avatar: 'LF' },
  { id: 'm4', name: 'Tom Wagner', email: 'tom@restaurant.de', role: 'staff', status: 'active', lastActive: '3 hr ago', avatar: 'TW' },
  { id: 'm5', name: 'Sarah Klein', email: 'sarah@restaurant.de', role: 'staff', status: 'inactive', lastActive: '2 weeks ago', avatar: 'SK' },
]

export const ocrItems = [
  { artNr: '101', item: 'Menu 1 — Chicken Plate', qty: 24, confidence: 98 },
  { artNr: '102', item: 'Burger XL', qty: 17, confidence: 96 },
  { artNr: '103', item: 'Menu 3 — Mixed Salad', qty: 8, confidence: 82 },
  { artNr: '104', item: 'Salmon Lunch Special', qty: 6, confidence: 95 },
  { artNr: '105', item: 'Classic Pancakes', qty: 4, confidence: 91 },
]

export const stockTrend = {
  labels: ['4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar'],
  physical: [32.0, 30.5, 28.0, 26.5, 28.5, 26.0, 24.5],
  theoretical: [34.5, 33.0, 31.2, 29.8, 32.0, 29.5, 27.0],
}
