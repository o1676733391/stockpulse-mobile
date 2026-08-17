import { AppNotification, NotificationFilter, NotificationType } from '@/types/notification';
import { apiClient, logDebugFallback } from './apiClient';

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  {
    label: string;
    icon: string;
    iconName: string;
    iconBg: string;
    bgColor: string;
    iconColor: string;
    badgeVariant: 'red' | 'amber' | 'orange' | 'purple' | 'blue' | 'green' | 'gray';
    defaultRoute: string;
  }
> = {
  expiring_soon: {
    label: 'Expiring Stock',
    icon: 'AlertTriangle',
    iconName: 'AlertTriangle',
    iconBg: '#fee2e2',
    bgColor: '#fee2e2',
    iconColor: '#b91c1c',
    badgeVariant: 'red',
    defaultRoute: '/expiration',
  },
  low_stock: {
    label: 'Low Stock',
    icon: 'Package',
    iconName: 'Package',
    iconBg: '#fef3c7',
    bgColor: '#fef3c7',
    iconColor: '#b45309',
    badgeVariant: 'amber',
    defaultRoute: '/inventory',
  },
  variance: {
    label: 'High Variance',
    icon: 'TrendingDown',
    iconName: 'TrendingDown',
    iconBg: '#ffedd5',
    bgColor: '#ffedd5',
    iconColor: '#c2410c',
    badgeVariant: 'orange',
    defaultRoute: '/stock-count/summary',
  },
  count_due: {
    label: 'Count Due',
    icon: 'ClipboardList',
    iconName: 'ClipboardList',
    iconBg: '#ede9fe',
    bgColor: '#ede9fe',
    iconColor: '#6d28d9',
    badgeVariant: 'purple',
    defaultRoute: '/stock-count',
  },
  ocr_complete: {
    label: 'OCR Processed',
    icon: 'ScanLine',
    iconName: 'ScanLine',
    iconBg: '#dbeafe',
    bgColor: '#dbeafe',
    iconColor: '#1d4ed8',
    badgeVariant: 'blue',
    defaultRoute: '/scan/review',
  },
  po_update: {
    label: 'Purchase Order',
    icon: 'ShoppingCart',
    iconName: 'ShoppingCart',
    iconBg: '#d1fae5',
    bgColor: '#d1fae5',
    iconColor: '#047857',
    badgeVariant: 'green',
    defaultRoute: '/orders',
  },
  goods_receipt_update: {
    label: 'Goods Receipt',
    icon: 'Truck',
    iconName: 'Truck',
    iconBg: '#e0e7ff',
    bgColor: '#e0e7ff',
    iconColor: '#4338ca',
    badgeVariant: 'blue',
    defaultRoute: '/orders',
  },
  expired_items: {
    label: 'Expired Stock',
    icon: 'AlertOctagon',
    iconName: 'AlertOctagon',
    iconBg: '#fee2e2',
    bgColor: '#fee2e2',
    iconColor: '#991b1b',
    badgeVariant: 'red',
    defaultRoute: '/expiration',
  },
  system_alert: {
    label: 'System Alert',
    icon: 'Info',
    iconName: 'Info',
    iconBg: '#f1f5f9',
    bgColor: '#f1f5f9',
    iconColor: '#475569',
    badgeVariant: 'gray',
    defaultRoute: '/notifications',
  },
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'expiring_soon',
    title: 'Salmon Expiring Tomorrow',
    body: 'Batch B1030 (4.2 kg Fresh Salmon) will expire on 11 Mar. Action waste reduction promo recommended.',
    time: '2h ago',
    timestamp: Date.now() - 2 * 3600 * 1000,
    read: false,
    urgent: true,
    priority: 'urgent',
    actions: [{ label: 'View Item', route: '/expiration' }],
  },
  {
    id: 'n2',
    type: 'variance',
    title: 'High Variance Detected',
    body: 'Chicken Breast daily count has −2.5 kg variance (−€12.00). Theoretical: 27.0 kg, Physical: 24.5 kg.',
    time: '4h ago',
    timestamp: Date.now() - 4 * 3600 * 1000,
    read: false,
    urgent: true,
    priority: 'high',
    actions: [{ label: 'Review Variance', route: '/stock-count/summary' }],
  },
  {
    id: 'n3',
    type: 'low_stock',
    title: 'Low Stock: Whole Milk',
    body: 'Current physical stock (8.0 L) is approaching safety threshold (4.0 L). POQ suggests reordering 16 L.',
    time: '5h ago',
    timestamp: Date.now() - 5 * 3600 * 1000,
    read: false,
    urgent: false,
    priority: 'normal',
    actions: [{ label: 'Create PO', route: '/orders/poq' }],
  },
  {
    id: 'n4',
    type: 'ocr_complete',
    title: 'POS Scan #2048 Processed',
    body: 'Lunch shift POS report parsed with 94% confidence. 5 menu items mapped to BOM recipes.',
    time: 'Yesterday',
    timestamp: Date.now() - 24 * 3600 * 1000,
    read: true,
    urgent: false,
    priority: 'normal',
    actions: [{ label: 'Review Deductions', route: '/scan/review' }],
  },
  {
    id: 'n5',
    type: 'goods_receipt_update',
    title: 'Goods Received: GR-20481',
    body: 'Metro Foods GmbH delivery of 20 kg Chicken Breast received and logged to Batch B1029.',
    time: '08 Mar',
    timestamp: Date.now() - 48 * 3600 * 1000,
    read: true,
    urgent: false,
    priority: 'low',
    actions: [{ label: 'View Order', route: '/orders' }],
  },
];

export interface INotificationService {
  getNotifications(filter?: NotificationFilter): Promise<AppNotification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  dismissNotification(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadCount(): Promise<number>;
}

export class RealNotificationService implements INotificationService {
  private notifications: AppNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

  async getNotifications(filter: NotificationFilter = 'all'): Promise<AppNotification[]> {
    try {
      const items = await apiClient.get<any[]>('/notifications');
      this.notifications = items.map((it) => ({
        id: it.id,
        type: it.type as NotificationType,
        title: it.title,
        body: it.message,
        time: it.time || 'Today',
        timestamp: Date.now(),
        read: Boolean(it.isRead),
        urgent: it.urgency === 'critical',
        priority: it.urgency === 'critical' ? 'urgent' : 'normal',
        actions: [{ label: 'View Details', route: it.route || '/notifications' }],
      }));
    } catch (err) {
      logDebugFallback('NotificationService', '/notifications', err);
    }

    if (filter === 'unread') {
      return this.notifications.filter((n) => !n.read);
    }
    if (filter === 'urgent') {
      return this.notifications.filter((n) => n.urgent);
    }
    return [...this.notifications];
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      logDebugFallback('NotificationService', `/notifications/${id}/read`, err);
    }
    const item = this.notifications.find((n) => n.id === id);
    if (item) item.read = true;
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post('/notifications/mark-all-read');
    } catch (err) {
      logDebugFallback('NotificationService', '/notifications/mark-all-read', err);
    }
    this.notifications.forEach((n) => {
      n.read = true;
    });
  }

  async dismissNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  async deleteNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter((n) => !n.read).length;
  }
}

export const notificationService: INotificationService = new RealNotificationService();
