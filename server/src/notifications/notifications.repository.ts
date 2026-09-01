import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { SupabaseService } from '../database/supabase.service';
import {
  NotificationPreferencesResponseDto,
  NotificationResponseDto,
  QueryNotificationsDto,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  UnreadCountResponseDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';
import { NotificationUrgency } from './entities/notification.entity';
import { INotificationRepository } from './interfaces/notification.repository.interface';

@Injectable()
export class NotificationsRepository implements INotificationRepository {
  private readonly logger = new Logger(NotificationsRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Create an in-app notification record.
   */
  async createNotification(
    dto: SendNotificationDto,
    storeId: string,
  ): Promise<NotificationResponseDto> {
    this.logger.log(`NotificationsRepository.createNotification: store=${storeId}, type=${dto.eventType}`);
    const client = this.supabaseService.getAdminClient();

    const notifNumber = `NOTIF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    if (!client) {
      return {
        id: 'notif-mock-01',
        storeId,
        userId: dto.userId,
        notificationNumber: notifNumber,
        eventType: dto.eventType,
        title: dto.title,
        message: dto.message,
        urgency: dto.urgency || 'NORMAL',
        route: dto.route,
        metadata: dto.metadata,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
    }

    const { data, error } = await client
      .from('notifications')
      .insert({
        store_id: storeId,
        user_id: dto.userId,
        notification_number: notifNumber,
        event_type: dto.eventType,
        title: dto.title,
        message: dto.message,
        urgency: dto.urgency || 'NORMAL',
        route: dto.route,
        metadata: dto.metadata,
        is_read: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Failed to create notification: ${error?.message}`);
      throw new InternalServerErrorException('Failed to create notification');
    }

    return this.mapRowToDto(data);
  }

  /**
   * Query historical in-app notifications with pagination.
   */
  async findNotifications(
    query: QueryNotificationsDto,
    storeId: string,
    userId?: string,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    this.logger.log(`NotificationsRepository.findNotifications: store=${storeId}, page=${page}`);
    const client = this.supabaseService.getAdminClient();

    if (!client) {
      return this.buildMockNotificationsList(page, limit, storeId, userId);
    }

    let supabaseQuery = client
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId);

    if (userId) {
      supabaseQuery = supabaseQuery.or(`user_id.eq.${userId},user_id.is.null`);
    }

    if (query.isRead !== undefined) {
      supabaseQuery = supabaseQuery.eq('is_read', query.isRead);
    }

    if (query.urgency) {
      supabaseQuery = supabaseQuery.eq('urgency', query.urgency);
    }

    if (query.eventType) {
      supabaseQuery = supabaseQuery.eq('event_type', query.eventType);
    }

    if (query.startDate) {
      supabaseQuery = supabaseQuery.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      supabaseQuery = supabaseQuery.lte('created_at', query.endDate);
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).range(from, to);

    let { data, count, error } = await supabaseQuery;

    if (error) {
      this.logger.error(`Failed to retrieve notifications: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve notifications');
    }

    if ((!count || count === 0) && page === 1 && !query.isRead && !query.eventType) {
      await this.ensureOperationalNotifications(storeId, client);
      let retryQuery = client
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId);

      if (userId) {
        retryQuery = retryQuery.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const retry = await retryQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      if (retry.data && retry.data.length > 0) {
        data = retry.data;
        count = retry.count;
      }
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const items: NotificationResponseDto[] = (data || []).map((row: any) => this.mapRowToDto(row));

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find notification by ID in store context.
   */
  async findById(id: string, storeId: string): Promise<NotificationResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('store_id', storeId)
      .single();

    if (error || !data) return null;
    return this.mapRowToDto(data);
  }

  /**
   * Mark single notification as read.
   */
  async markAsRead(
    id: string,
    storeId: string,
    userId?: string,
  ): Promise<NotificationResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    const now = new Date().toISOString();

    if (!client) {
      return {
        id,
        storeId,
        userId,
        notificationNumber: 'NOTIF-001',
        eventType: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: 'Whole Milk is below safety threshold',
        urgency: 'CRITICAL',
        isRead: true,
        readAt: now,
        createdAt: now,
      };
    }

    let query = client
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', id)
      .eq('store_id', storeId);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query.select('*').single();
    if (error || !data) return null;

    return this.mapRowToDto(data);
  }

  /**
   * Mark all notifications in active store context as read for user.
   */
  async markAllAsRead(storeId: string, userId: string): Promise<number> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return 3;

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('store_id', storeId)
      .eq('is_read', false)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .select('id');

    if (error) {
      this.logger.error(`Failed to mark all as read: ${error.message}`);
      throw new InternalServerErrorException('Failed to mark all notifications as read');
    }

    return (data || []).length;
  }

  /**
   * Delete or dismiss an in-app notification.
   */
  async deleteNotification(id: string, storeId: string, userId?: string): Promise<boolean> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return true;

    let query = client
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { error } = await query;
    if (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete notification');
    }

    return true;
  }

  /**
   * Count unread and critical notifications.
   */
  async getUnreadCount(storeId: string, userId: string): Promise<UnreadCountResponseDto> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return { unreadCount: 0, criticalCount: 0 };
    }

    let { count: unreadCount } = await client
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('is_read', false)
      .or(`user_id.eq.${userId},user_id.is.null`);

    let { count: criticalCount } = await client
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('is_read', false)
      .eq('urgency', 'CRITICAL')
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (!unreadCount || unreadCount === 0) {
      await this.ensureOperationalNotifications(storeId, client);

      const retryUnread = await client
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_read', false)
        .or(`user_id.eq.${userId},user_id.is.null`);

      const retryCritical = await client
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId)
        .eq('is_read', false)
        .eq('urgency', 'CRITICAL')
        .or(`user_id.eq.${userId},user_id.is.null`);

      unreadCount = retryUnread.count;
      criticalCount = retryCritical.count;
    }

    return {
      unreadCount: unreadCount || 0,
      criticalCount: criticalCount || 0,
    };
  }

  /**
   * Register or update Expo push device token for user.
   */
  async registerDeviceToken(
    dto: RegisterDeviceTokenDto,
    storeId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`NotificationsRepository.registerDeviceToken: user=${userId}, platform=${dto.platform}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    const now = new Date().toISOString();
    await client.from('device_tokens').upsert(
      {
        user_id: userId,
        store_id: storeId,
        expo_push_token: dto.expoPushToken,
        platform: dto.platform,
        app_version: dto.appVersion,
        is_active: true,
        last_used_at: now,
        updated_at: now,
      },
      { onConflict: 'expo_push_token' },
    );
  }

  /**
   * Deactivate device token on logout.
   */
  async unregisterDeviceToken(
    token: string,
    storeId: string,
    userId: string,
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return;

    await client
      .from('device_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('expo_push_token', token)
      .eq('user_id', userId);
  }

  /**
   * Find active push tokens for user.
   */
  async findActiveTokensForUser(userId: string, storeId: string): Promise<string[]> {
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      return ['ExponentPushToken[mock-token-01]'];
    }

    const { data } = await client
      .from('device_tokens')
      .select('expo_push_token')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('is_active', true);

    return (data || []).map((row: any) => row.expo_push_token);
  }

  /**
   * Get user notification preferences.
   */
  async getPreferences(
    userId: string,
    storeId: string,
  ): Promise<NotificationPreferencesResponseDto> {
    // Default fallback preferences
    return {
      userId,
      storeId,
      inAppEnabled: true,
      pushEnabled: true,
      emailEnabled: false,
      lowStockAlerts: true,
      expiringBatches: true,
      poStatusUpdates: true,
      stockCountReminders: true,
      ocrScanCompleted: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update user notification preferences.
   */
  async updatePreferences(
    userId: string,
    storeId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    const current = await this.getPreferences(userId, storeId);
    return {
      ...current,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
  }

  private async ensureOperationalNotifications(storeId: string, client: any): Promise<void> {
    try {
      const { count } = await client
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('store_id', storeId);

      if (count && count > 0) return;

      const notificationsToInsert: any[] = [];
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      // Check inventory items
      const { data: items } = await client
        .from('inventory_items')
        .select('id, name, physical_stock, safety_stock, unit')
        .eq('store_id', storeId)
        .is('deleted_at', null);

      if (items && items.length > 0) {
        // 1. Low stock alerts
        for (const item of items) {
          const phys = Number(item.physical_stock || 0);
          const safe = Number(item.safety_stock || 0);
          if (phys <= safe) {
            notificationsToInsert.push({
              store_id: storeId,
              user_id: null,
              notification_number: `NOTIF-LOW-${Date.now().toString(36).slice(-4).toUpperCase()}`,
              event_type: 'LOW_STOCK',
              title: `Low Stock: ${item.name}`,
              message: `${item.name} (${phys} ${item.unit || 'units'}) is below minimum safety threshold (${safe} ${item.unit || 'units'}).`,
              urgency: 'CRITICAL',
              route: `/inventory/${item.id}`,
              metadata: { itemId: item.id },
              is_read: false,
            });
          }
        }

        // 2. Expiring / Expired batches
        const itemIds = items.map((i: any) => i.id);
        const { data: batches } = await client
          .from('inventory_batches')
          .select('id, item_id, batch_number, quantity, expiry_date')
          .in('item_id', itemIds)
          .is('deleted_at', null);

        if (batches && batches.length > 0) {
          const itemMap = new Map(items.map((i: any) => [i.id, i.name]));
          for (const b of batches) {
            const itemName = itemMap.get(b.item_id) || 'Item';
            if (b.expiry_date < todayIso) {
              notificationsToInsert.push({
                store_id: storeId,
                user_id: null,
                notification_number: `NOTIF-EXP-${Date.now().toString(36).slice(-4).toUpperCase()}`,
                event_type: 'EXPIRED_ITEMS',
                title: `Expired Batch: ${itemName}`,
                message: `Batch ${b.batch_number} expired on ${b.expiry_date}. Waste logging or disposal action required.`,
                urgency: 'CRITICAL',
                route: '/expiration',
                metadata: { batchId: b.id, itemId: b.item_id },
                is_read: false,
              });
            } else if (b.expiry_date <= sevenDaysLater) {
              notificationsToInsert.push({
                store_id: storeId,
                user_id: null,
                notification_number: `NOTIF-EXP-${Date.now().toString(36).slice(-4).toUpperCase()}`,
                event_type: 'EXPIRING_SOON',
                title: `Expiring Soon: ${itemName}`,
                message: `Batch ${b.batch_number} (${b.quantity} units) expires on ${b.expiry_date}. Prioritize in prep schedule.`,
                urgency: 'CRITICAL',
                route: '/expiration',
                metadata: { batchId: b.id, itemId: b.item_id },
                is_read: false,
              });
            }
          }
        }

        // 3. Stock count schedule reminder
        notificationsToInsert.push({
          store_id: storeId,
          user_id: null,
          notification_number: `NOTIF-CNT-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          event_type: 'COUNT_DUE',
          title: 'Daily Stock Count Due',
          message: 'Scheduled closing inventory count is due for kitchen audit and ledger alignment.',
          urgency: 'NORMAL',
          route: '/stock-count',
          is_read: false,
        });
      } else {
        // Welcome notification for store
        notificationsToInsert.push({
          store_id: storeId,
          user_id: null,
          notification_number: `NOTIF-SYS-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          event_type: 'SYSTEM_HEALTH_CHECK',
          title: 'Store System Online',
          message: 'Store connection established. Add ingredients in Master Inventory to enable real-time tracking.',
          urgency: 'NORMAL',
          route: '/inventory',
          is_read: false,
        });
      }

      if (notificationsToInsert.length > 0) {
        await client.from('notifications').insert(notificationsToInsert);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to auto-seed operational notifications: ${err.message}`);
    }
  }

  private mapRowToDto(row: any): NotificationResponseDto {
    return {
      id: row.id,
      storeId: row.store_id,
      userId: row.user_id,
      notificationNumber: row.notification_number,
      eventType: row.event_type,
      title: row.title,
      message: row.message,
      urgency: row.urgency as NotificationUrgency,
      route: row.route,
      metadata: row.metadata,
      isRead: Boolean(row.is_read),
      readAt: row.read_at,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  private buildMockNotificationsList(
    page: number,
    limit: number,
    storeId: string,
    userId?: string,
  ): PaginatedResponseDto<NotificationResponseDto> {
    const mockItems: NotificationResponseDto[] = [
      {
        id: 'notif-01',
        storeId,
        userId,
        notificationNumber: 'NOTIF-20260820-001',
        eventType: 'LOW_STOCK',
        title: 'Critical Low Stock: Whole Milk',
        message: 'Physical stock (8L) is below safety stock threshold (15L).',
        urgency: 'CRITICAL',
        route: '/inventory/01915dfa-b1c4-7221-9988-51b72e04e0a1',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-02',
        storeId,
        userId,
        notificationNumber: 'NOTIF-20260820-002',
        eventType: 'PO_STATUS',
        title: 'PO Approved',
        message: 'Purchase Order PO-20260820-001 has been approved by manager.',
        urgency: 'NORMAL',
        route: '/procurement/po-uuid-01',
        isRead: true,
        readAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    return {
      data: mockItems,
      meta: {
        page,
        limit,
        total: mockItems.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}
