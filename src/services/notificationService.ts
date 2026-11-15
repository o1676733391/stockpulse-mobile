import { formatTimestampRelative } from '@/i18n/formatters';
import { i18n } from '@/i18n/manager';
import { SupportedLanguage } from '@/i18n/types';
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
    defaultRoute: '/inventory/overview',
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
  const currentLang = i18n ? i18n.getLanguage() : 'en';
  return formatTimestampRelative(timestamp, currentLang);
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

export function localizeNotification(
  notification: AppNotification,
  language: SupportedLanguage = i18n ? i18n.getLanguage() : 'en'
): { title: string; body: string; time: string } {
  const time = notification.timestamp
    ? formatTimestampRelative(notification.timestamp, language)
    : notification.time || (language === 'de' ? 'Heute' : 'Today');

  const rawTitle = notification.title || '';
  const rawBody = notification.body || '';

  if (language === 'de') {
    let title = rawTitle;
    let body = rawBody;

    if (
      rawTitle === 'Store System Online' ||
      rawTitle.includes('System Online') ||
      rawTitle.includes('Store System') ||
      rawBody.includes('Store connection established') ||
      rawBody.includes('Master Inventory')
    ) {
      title = 'Betriebssystem online';
      body = 'Verbindung zum Betrieb hergestellt. Fügen Sie Zutaten im Inventar hinzu, um die Bestandsführung zu aktivieren.';
    } else if (rawTitle === 'Daily Stock Count Due' || rawTitle.includes('Stock Count Due')) {
      title = 'Tägliche Bestandszählung fällig';
      body = 'Geplante Inventurzählung für Küchenprüfung und Kassenabgleich ist fällig.';
    } else if (rawTitle === 'Low Stock Alert' || rawTitle.includes('Low Stock')) {
      title = rawTitle.replace('Low Stock Alert', 'Niedriger Meldebestand').replace('Low Stock:', 'Niedriger Meldebestand:');
      body = body.replace(/items? are below minimum threshold/i, 'Artikel liegen unter dem Meldebestand');
    } else if (rawTitle === 'Expiring Stock' || rawTitle.includes('Expiring Soon') || rawTitle.includes('Expiring')) {
      title = rawTitle.replace('Expiring Stock', 'Ablaufende Chargen').replace('Expiring Soon:', 'Läuft bald ab:');
      body = body.replace(/batches expiring soon/i, 'Chargen laufen bald ab');
    } else if (rawTitle.includes('Purchase Order') || rawTitle.includes('Goods Receipt') || rawTitle.includes('PO Approved')) {
      title = 'Wareneingang verbucht';
    } else if (rawTitle.includes('Variance')) {
      title = 'Inventurabweichung festgestellt';
    }

    return { title, body, time };
  }

  if (language === 'fr') {
    let title = rawTitle;
    let body = rawBody;
    if (rawTitle === 'Store System Online' || rawTitle.includes('System Online')) {
      title = 'Système connecté';
      body = 'Connexion à l’établissement établie. Ajoutez des ingrédients pour démarrer le suivi.';
    } else if (rawTitle === 'Daily Stock Count Due' || rawTitle.includes('Stock Count Due')) {
      title = 'Inventaire journalier requis';
      body = 'L’inventaire prévu en cuisine est requis pour la conformité de caisse.';
    }
    return { title, body, time };
  }

  if (language === 'es') {
    let title = rawTitle;
    let body = rawBody;
    if (rawTitle === 'Store System Online' || rawTitle.includes('System Online')) {
      title = 'Sistema conectado';
      body = 'Conexión con el local establecida. Añada ingredientes en inventario para iniciar el seguimiento.';
    } else if (rawTitle === 'Daily Stock Count Due' || rawTitle.includes('Stock Count Due')) {
      title = 'Inventario diario pendiente';
      body = 'El recuento programado en cocina está pendiente para la auditoría de caja.';
    }
    return { title, body, time };
  }

  if (language === 'it') {
    let title = rawTitle;
    let body = rawBody;
    if (rawTitle === 'Store System Online' || rawTitle.includes('System Online')) {
      title = 'Sistema operativo online';
      body = 'Connessione al locale stabilita. Aggiungi ingredienti per abilitare il tracciamento.';
    } else if (rawTitle === 'Daily Stock Count Due' || rawTitle.includes('Stock Count Due')) {
      title = 'Conteggio scorte giornaliero';
      body = 'Il conteggio programmato delle scorte di chiusura è dovuto per la verifica.';
    }
    return { title, body, time };
  }

  return { title: rawTitle, body: rawBody, time };
}
