import { BadgeVariant } from '@/constants/theme';
import {
  AppNotification,
  NotificationFilter,
  NotificationType,
} from '@/types/notification';

export interface NotificationTypeConfig {
  iconName: string;
  iconColor: string;
  bgColor: string;
  badgeVariant: BadgeVariant;
  label: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  expiring_soon: {
    iconName: 'AlertTriangle',
    iconColor: '#dc2626',
    bgColor: '#fee2e2',
    badgeVariant: 'red',
    label: 'Expiring Soon',
  },
  expired_items: {
    iconName: 'PackageX',
    iconColor: '#64748b',
    bgColor: '#f1f5f9',
    badgeVariant: 'gray',
    label: 'Expired Batch',
  },
  low_stock: {
    iconName: 'Package',
    iconColor: '#d97706',
    bgColor: '#fef3c7',
    badgeVariant: 'amber',
    label: 'Low Stock',
  },
  variance: {
    iconName: 'TrendingDown',
    iconColor: '#ea580c',
    bgColor: '#ffedd5',
    badgeVariant: 'orange',
    label: 'Major Variance',
  },
  count_due: {
    iconName: 'ClipboardList',
    iconColor: '#7c3aed',
    bgColor: '#ede9fe',
    badgeVariant: 'purple',
    label: 'Audit Due',
  },
  ocr_complete: {
    iconName: 'ScanLine',
    iconColor: '#2563eb',
    bgColor: '#dbeafe',
    badgeVariant: 'blue',
    label: 'POS Scan Processed',
  },
  po_update: {
    iconName: 'ShoppingCart',
    iconColor: '#059669',
    bgColor: '#d1fae5',
    badgeVariant: 'green',
    label: 'PO Recommendation',
  },
  goods_receipt_update: {
    iconName: 'Truck',
    iconColor: '#059669',
    bgColor: '#d1fae5',
    badgeVariant: 'green',
    label: 'Goods Received',
  },
  system_alert: {
    iconName: 'ShieldCheck',
    iconColor: '#475569',
    bgColor: '#f1f5f9',
    badgeVariant: 'gray',
    label: 'System Notice',
  },
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'expiring_soon',
    title: 'Critical Expiry: Fresh Salmon',
    body: '4.2 kg Fresh Salmon (Batch #B1030) expires tomorrow. Estimated €68.04 value at risk.',
    details: 'Salmon was received on 08 Mar. Current physical stock indicates 4.2 kg remaining with an active smart recipe suggestion available.',
    time: '2 min ago',
    timestamp: Date.now() - 2 * 60 * 1000,
    read: false,
    urgent: true,
    priority: 'urgent',
    entityId: 'e1',
    actions: [
      { label: 'View Expiry →', route: '/expiration' },
      { label: 'Smart Suggestions', route: '/expiration/waste-reduction' },
    ],
  },
  {
    id: 'n2',
    type: 'expiring_soon',
    title: 'Expiry Warning: Romaine Lettuce',
    body: '3.1 kg Romaine Lettuce expires in 2 days. €6.82 at risk.',
    details: 'Batch #B1033. High risk of wilt/spoilage. Recommended Caesar Salad promotion to clear stock.',
    time: '15 min ago',
    timestamp: Date.now() - 15 * 60 * 1000,
    read: false,
    urgent: true,
    priority: 'urgent',
    entityId: 'e2',
    actions: [
      { label: 'View Expiry →', route: '/expiration' },
    ],
  },
  {
    id: 'n3',
    type: 'low_stock',
    title: 'Low Stock Alert: Whole Milk',
    body: 'Whole Milk is below safety stock level. 8 L remaining (Safety: 4 L, Target: 20 L).',
    details: 'Daily consumption is estimated at 6 L/day. Reorder recommended immediately to prevent 86 stock-outs on morning shift.',
    time: '1 hr ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: false,
    urgent: false,
    priority: 'high',
    entityId: 'i5',
    actions: [
      { label: 'View Inventory →', route: '/inventory' },
      { label: 'Create PO →', route: '/orders/poq' },
    ],
  },
  {
    id: 'n4',
    type: 'variance',
    title: 'Major Variance: Chicken Breast',
    body: 'Chicken Breast shows -9.3% variance between physical count and POS BOM deductions.',
    details: 'Physical count showed 24.5 kg vs theoretical 27.0 kg. Discrepancy value impact: -€12.00.',
    time: '2 hr ago',
    timestamp: Date.now() - 120 * 60 * 1000,
    read: false,
    urgent: false,
    priority: 'high',
    entityId: 'i1',
    actions: [
      { label: 'Review Variance →', route: '/stock-count/summary' },
    ],
  },
  {
    id: 'n5',
    type: 'count_due',
    title: 'Daily Stock Count Due',
    body: 'Daily closing stock count is scheduled for today. 42 of 68 items counted.',
    details: 'Scheduled closing audit for Bella Cucina main store. Critical proteins and fresh produce must be audited before shift end.',
    time: '6 hr ago',
    timestamp: Date.now() - 360 * 60 * 1000,
    read: true,
    urgent: false,
    priority: 'normal',
    actions: [
      { label: 'Continue Count →', route: '/stock-count/active' },
    ],
  },
  {
    id: 'n6',
    type: 'ocr_complete',
    title: 'POS Scan Processed: Report #2048',
    body: 'Evening POS report processed. 24 menu items detected with 94% average OCR confidence.',
    details: 'BOM ingredients deducted: Chicken Breast -2.5 kg, Potatoes -3.8 kg, Cooking Oil -0.4 L. Theoretical inventory updated.',
    time: '8 hr ago',
    timestamp: Date.now() - 480 * 60 * 1000,
    read: true,
    urgent: false,
    priority: 'normal',
    actions: [
      { label: 'View Deduction →', route: '/scan/result' },
    ],
  },
  {
    id: 'n7',
    type: 'po_update',
    title: 'POQ Recommendations Ready',
    body: '5 items require reordering based on target stock formulas. Total estimated spend: €378.50.',
    details: 'Supplier groups: Metro Foods GmbH (3 items), FreshProduce GmbH (2 items). Auto-calculated POQ ready for one-tap PO creation.',
    time: 'Yesterday',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    urgent: false,
    priority: 'normal',
    actions: [
      { label: 'Review POQ →', route: '/orders/poq' },
    ],
  },
  {
    id: 'n8',
    type: 'goods_receipt_update',
    title: 'Goods Received: Metro Foods GmbH',
    body: 'PO-1 received and processed. 3 items added to physical stock with new BBD batches.',
    details: 'Invoice INV-20481 confirmed by Kitchen Admin. +20 kg Chicken Breast (BBD: 24 Mar), +50 kg Potatoes (BBD: 15 Apr), +15 L Cooking Oil (BBD: 30 Jul).',
    time: 'Yesterday',
    timestamp: Date.now() - 28 * 60 * 60 * 1000,
    read: true,
    urgent: false,
    priority: 'normal',
    actions: [
      { label: 'View Inventory →', route: '/inventory' },
    ],
  },
];

export interface INotificationService {
  getNotifications(filter?: NotificationFilter): Promise<AppNotification[]>;
  getNotificationById(id: string): Promise<AppNotification | null>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  dismissNotification(id: string): Promise<void>;
  registerPushToken(token: string): Promise<void>;
  onNotificationReceived(callback: (n: AppNotification) => void): () => void;
}

export class MockNotificationService implements INotificationService {
  private notifications: AppNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
  private dismissedIds = new Set<string>();
  private listeners: Array<(n: AppNotification) => void> = [];

  async getNotifications(filter: NotificationFilter = 'all'): Promise<AppNotification[]> {
    let list = this.notifications.filter((n) => !this.dismissedIds.has(n.id));

    if (filter === 'unread') {
      list = list.filter((n) => !n.read);
    } else if (filter === 'urgent') {
      list = list.filter((n) => n.urgent);
    }

    return [...list];
  }

  async getNotificationById(id: string): Promise<AppNotification | null> {
    const item = this.notifications.find((n) => n.id === id);
    if (!item || this.dismissedIds.has(id)) return null;
    return { ...item };
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter((n) => !n.read && !this.dismissedIds.has(n.id)).length;
  }

  async markAsRead(id: string): Promise<void> {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach((n) => {
      n.read = true;
    });
  }

  async dismissNotification(id: string): Promise<void> {
    this.dismissedIds.add(id);
  }

  async registerPushToken(token: string): Promise<void> {
    // Stub for Expo Push Notification token registration
  }

  onNotificationReceived(callback: (n: AppNotification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export const notificationService: INotificationService = new MockNotificationService();
