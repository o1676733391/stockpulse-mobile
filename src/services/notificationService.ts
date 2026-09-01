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

export interface INotificationService {
  getNotifications(filter?: NotificationFilter): Promise<AppNotification[]>;
  getNotificationById(id: string): Promise<AppNotification | null>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  dismissNotification(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadCount(): Promise<number>;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export class RealNotificationService implements INotificationService {
  async getNotifications(filter: NotificationFilter = 'all'): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<any>('/notifications');
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const notifications: AppNotification[] = rawList.map((it) => {
        const rawType = String(it.eventType || it.event_type || it.type || '').toUpperCase();
        let mappedType: NotificationType = 'system_alert';
        if (rawType.includes('LOW_STOCK')) mappedType = 'low_stock';
        else if (rawType.includes('EXPIRED_') || rawType === 'EXPIRED' || rawType.includes('EXPIRED_ITEMS')) mappedType = 'expired_items';
        else if (rawType.includes('EXPIR')) mappedType = 'expiring_soon';
        else if (rawType.includes('PO_') || rawType.includes('PURCHASE')) mappedType = 'po_update';
        else if (rawType.includes('GOODS') || rawType.includes('RECEIPT')) mappedType = 'goods_receipt_update';
        else if (rawType.includes('VARIANCE')) mappedType = 'variance';
        else if (rawType.includes('COUNT')) mappedType = 'count_due';
        else if (rawType.includes('OCR')) mappedType = 'ocr_complete';

        const isUrgent = it.urgency === 'CRITICAL' || it.urgency === 'critical';
        const isRead = Boolean(it.isRead ?? it.is_read ?? false);
        const createdAt = it.createdAt || it.created_at;
        const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();

        return {
          id: it.id,
          type: mappedType,
          title: it.title || 'Notification',
          body: it.message || it.body || '',
          time: formatRelativeTime(timestamp),
          timestamp,
          read: isRead,
          urgent: isUrgent,
          priority: isUrgent ? 'urgent' : 'normal',
          actions: it.route ? [{ label: 'View Details', route: it.route }] : [],
        };
      });

      if (filter === 'unread') {
        return notifications.filter((n) => !n.read);
      }
      if (filter === 'urgent') {
        return notifications.filter((n) => n.urgent);
      }
      return notifications;
    } catch (err) {
      logDebugFallback('NotificationService', '/notifications', err);
      throw err;
    }
  }

  async getNotificationById(id: string): Promise<AppNotification | null> {
    try {
      const it = await apiClient.get<any>(`/notifications/${id}`);
      if (!it) return null;

      const rawType = String(it.eventType || it.event_type || it.type || '').toUpperCase();
      let mappedType: NotificationType = 'system_alert';
      if (rawType.includes('LOW_STOCK')) mappedType = 'low_stock';
      else if (rawType.includes('EXPIRED_') || rawType === 'EXPIRED' || rawType.includes('EXPIRED_ITEMS')) mappedType = 'expired_items';
      else if (rawType.includes('EXPIR')) mappedType = 'expiring_soon';
      else if (rawType.includes('PO_') || rawType.includes('PURCHASE')) mappedType = 'po_update';
      else if (rawType.includes('GOODS') || rawType.includes('RECEIPT')) mappedType = 'goods_receipt_update';
      else if (rawType.includes('VARIANCE')) mappedType = 'variance';
      else if (rawType.includes('COUNT')) mappedType = 'count_due';
      else if (rawType.includes('OCR')) mappedType = 'ocr_complete';

      const isUrgent = it.urgency === 'CRITICAL' || it.urgency === 'critical';
      const isRead = Boolean(it.isRead ?? it.is_read ?? false);
      const createdAt = it.createdAt || it.created_at;
      const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();

      return {
        id: it.id,
        type: mappedType,
        title: it.title || 'Notification',
        body: it.message || it.body || '',
        time: formatRelativeTime(timestamp),
        timestamp,
        read: isRead,
        urgent: isUrgent,
        priority: isUrgent ? 'urgent' : 'normal',
        actions: it.route ? [{ label: 'View Details', route: it.route }] : [],
      };
    } catch {
      try {
        const all = await this.getNotifications('all');
        return all.find((n) => n.id === id) || null;
      } catch {
        return null;
      }
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      logDebugFallback('NotificationService', `/notifications/${id}/read`, err);
      throw err;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post('/notifications/read-all');
    } catch (err) {
      logDebugFallback('NotificationService', '/notifications/read-all', err);
      throw err;
    }
  }

  async dismissNotification(id: string): Promise<void> {
    try {
      await apiClient.del(`/notifications/${id}`);
    } catch (err) {
      logDebugFallback('NotificationService', `/notifications/${id} [DELETE]`, err);
      throw err;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await apiClient.del(`/notifications/${id}`);
    } catch (err) {
      logDebugFallback('NotificationService', `/notifications/${id} [DELETE]`, err);
      throw err;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<any>('/notifications/unread-count');
      if (typeof res?.unreadCount === 'number') {
        return res.unreadCount;
      }
      const items = await this.getNotifications('unread');
      return items.length;
    } catch {
      return 0;
    }
  }
}

export const notificationService: INotificationService = new RealNotificationService();
