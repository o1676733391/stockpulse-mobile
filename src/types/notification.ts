export type NotificationType =
  | 'low_stock'
  | 'expiring_soon'
  | 'expired_items'
  | 'po_update'
  | 'goods_receipt_update'
  | 'variance'
  | 'count_due'
  | 'ocr_complete'
  | 'system_alert';

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface NotificationAction {
  label: string;
  route: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  details?: string;
  time: string;
  timestamp: number;
  read: boolean;
  urgent: boolean;
  priority: NotificationPriority;
  entityId?: string;
  actions?: NotificationAction[];
}

export type NotificationFilter = 'all' | 'unread' | 'urgent';
