import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import {
  NotificationPreferencesResponseDto,
  NotificationResponseDto,
  QueryNotificationsDto,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  UnreadCountResponseDto,
  UpdateNotificationPreferencesDto,
} from '../dto/notification.dto';

export interface INotificationRepository {
  // In-app Notifications
  createNotification(
    dto: SendNotificationDto,
    storeId: string,
  ): Promise<NotificationResponseDto>;

  findNotifications(
    query: QueryNotificationsDto,
    storeId: string,
    userId?: string,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>>;

  markAsRead(
    id: string,
    storeId: string,
    userId?: string,
  ): Promise<NotificationResponseDto | null>;

  markAllAsRead(
    storeId: string,
    userId: string,
  ): Promise<number>;

  getUnreadCount(
    storeId: string,
    userId: string,
  ): Promise<UnreadCountResponseDto>;

  // Device Tokens
  registerDeviceToken(
    dto: RegisterDeviceTokenDto,
    storeId: string,
    userId: string,
  ): Promise<void>;

  unregisterDeviceToken(
    token: string,
    storeId: string,
    userId: string,
  ): Promise<void>;

  findActiveTokensForUser(
    userId: string,
    storeId: string,
  ): Promise<string[]>;

  // Preferences
  getPreferences(
    userId: string,
    storeId: string,
  ): Promise<NotificationPreferencesResponseDto>;

  updatePreferences(
    userId: string,
    storeId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto>;
}
