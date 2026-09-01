import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import {
  BatchMarkReadResponseDto,
  NotificationPreferencesResponseDto,
  NotificationResponseDto,
  QueryNotificationsDto,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  UnreadCountResponseDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';
import { NotificationsRepository } from './notifications.repository';
import { PushNotificationProviderFactory } from './providers/push-notification-provider.factory';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly pushNotificationProviderFactory: PushNotificationProviderFactory,
  ) {}

  /**
   * Dispatch an in-app notification and optionally trigger push notification to user devices.
   */
  async sendNotification(
    dto: SendNotificationDto,
    storeId: string,
  ): Promise<NotificationResponseDto> {
    this.logger.log(`NotificationsService.sendNotification: "${dto.title}" (${dto.eventType}) in store=${storeId}`);

    // 1. Create in-app notification record in DB
    const inAppRecord = await this.notificationsRepository.createNotification(dto, storeId);

    // 2. Dispatch Push Notification if recipient specified
    if (dto.userId) {
      try {
        const preferences = await this.notificationsRepository.getPreferences(dto.userId, storeId);
        if (preferences.pushEnabled) {
          const tokens = await this.notificationsRepository.findActiveTokensForUser(dto.userId, storeId);
          if (tokens.length > 0) {
            const pushProvider = this.pushNotificationProviderFactory.getProvider('expo');
            await pushProvider.sendPush({
              to: tokens,
              title: dto.title,
              body: dto.message,
              data: {
                route: dto.route,
                notificationId: inAppRecord.id,
                eventType: dto.eventType,
                ...dto.metadata,
              },
              priority: dto.urgency === 'CRITICAL' ? 'high' : 'default',
            });
          }
        }
      } catch (err: any) {
        this.logger.warn(`Push delivery skipped or failed: ${err.message}`);
      }
    }

    return inAppRecord;
  }

  /**
   * Query historical in-app notifications with pagination.
   */
  async findNotifications(
    query: QueryNotificationsDto,
    storeId: string,
    userId?: string,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    return this.notificationsRepository.findNotifications(query, storeId, userId);
  }

  /**
   * Get notification by ID in store context.
   */
  async findById(id: string, storeId: string): Promise<NotificationResponseDto> {
    const notif = await this.notificationsRepository.findById(id, storeId);
    if (!notif) {
      throw new NotFoundException(`Notification '${id}' not found`);
    }
    return notif;
  }

  /**
   * Mark notification as read.
   */
  async markAsRead(
    id: string,
    storeId: string,
    userId?: string,
  ): Promise<NotificationResponseDto> {
    const updated = await this.notificationsRepository.markAsRead(id, storeId, userId);
    if (!updated) {
      throw new NotFoundException(`Notification '${id}' not found`);
    }
    return updated;
  }

  /**
   * Mark all unread notifications in store as read.
   */
  async markAllAsRead(
    storeId: string,
    userId: string,
  ): Promise<BatchMarkReadResponseDto> {
    const markedReadCount = await this.notificationsRepository.markAllAsRead(storeId, userId);
    return {
      success: true,
      markedReadCount,
    };
  }

  /**
   * Get unread badge counts.
   */
  async getUnreadCount(
    storeId: string,
    userId: string,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationsRepository.getUnreadCount(storeId, userId);
  }

  /**
   * Register device token for push notifications.
   */
  async registerDeviceToken(
    dto: RegisterDeviceTokenDto,
    storeId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsRepository.registerDeviceToken(dto, storeId, userId);
    return { success: true };
  }

  /**
   * Delete or dismiss notification.
   */
  async deleteNotification(
    id: string,
    storeId: string,
    userId?: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.notificationsRepository.deleteNotification(id, storeId, userId);
    return { success: deleted };
  }

  /**
   * Unregister device token.
   */
  async unregisterDeviceToken(
    token: string,
    storeId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsRepository.unregisterDeviceToken(token, storeId, userId);
    return { success: true };
  }

  /**
   * Get user notification preferences.
   */
  async getPreferences(
    userId: string,
    storeId: string,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notificationsRepository.getPreferences(userId, storeId);
  }

  /**
   * Update user notification preferences.
   */
  async updatePreferences(
    userId: string,
    storeId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notificationsRepository.updatePreferences(userId, storeId, dto);
  }
}
