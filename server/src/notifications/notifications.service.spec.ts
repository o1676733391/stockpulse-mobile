import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationPreferencesResponseDto,
  NotificationResponseDto,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { PushNotificationProviderFactory } from './providers/push-notification-provider.factory';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationsRepository>;
  let pushProviderFactory: jest.Mocked<PushNotificationProviderFactory>;

  const mockNotif: NotificationResponseDto = {
    id: 'notif-01',
    storeId: 'store-01',
    userId: 'user-01',
    notificationNumber: 'NOTIF-01',
    eventType: 'LOW_STOCK',
    title: 'Low Milk Stock',
    message: 'Whole milk is low',
    urgency: 'CRITICAL',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const mockPrefs: NotificationPreferencesResponseDto = {
    userId: 'user-01',
    storeId: 'store-01',
    inAppEnabled: true,
    pushEnabled: true,
    emailEnabled: false,
    lowStockAlerts: true,
    expiringBatches: true,
    poStatusUpdates: true,
    stockCountReminders: true,
    ocrScanCompleted: true,
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockRepo = {
      createNotification: jest.fn().mockResolvedValue(mockNotif),
      findNotifications: jest.fn().mockResolvedValue({
        data: [mockNotif],
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }),
      markAsRead: jest.fn().mockResolvedValue({ ...mockNotif, isRead: true }),
      markAllAsRead: jest.fn().mockResolvedValue(2),
      getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 1, criticalCount: 1 }),
      registerDeviceToken: jest.fn().mockResolvedValue(undefined),
      unregisterDeviceToken: jest.fn().mockResolvedValue(undefined),
      findActiveTokensForUser: jest.fn().mockResolvedValue(['ExponentPushToken[user-tok-1]']),
      getPreferences: jest.fn().mockResolvedValue(mockPrefs),
      updatePreferences: jest.fn().mockResolvedValue(mockPrefs),
    };

    const mockPushProvider = {
      providerId: 'expo',
      providerName: 'Expo',
      sendPush: jest.fn().mockResolvedValue({ success: true, recipientCount: 1 }),
      sendBatch: jest.fn().mockResolvedValue({ totalSent: 1, totalFailed: 0, tickets: [] }),
      healthCheck: jest.fn().mockResolvedValue(true),
    };

    const mockPushFactory = {
      getProvider: jest.fn().mockReturnValue(mockPushProvider),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockRepo,
        },
        {
          provide: PushNotificationProviderFactory,
          useValue: mockPushFactory,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(NotificationsRepository);
    pushProviderFactory = module.get(PushNotificationProviderFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should create in-app notification and trigger push notification', async () => {
      const dto: SendNotificationDto = {
        userId: 'user-01',
        eventType: 'LOW_STOCK',
        title: 'Low Milk Stock',
        message: 'Whole milk is low',
        urgency: 'CRITICAL',
      };

      const result = await service.sendNotification(dto, 'store-01');

      expect(repository.createNotification).toHaveBeenCalledWith(dto, 'store-01');
      expect(repository.findActiveTokensForUser).toHaveBeenCalledWith('user-01', 'store-01');
      expect(result.id).toBe('notif-01');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await service.markAsRead('notif-01', 'store-01', 'user-01');

      expect(repository.markAsRead).toHaveBeenCalledWith('notif-01', 'store-01', 'user-01');
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      repository.markAsRead.mockResolvedValueOnce(null);

      await expect(service.markAsRead('non-existent', 'store-01', 'user-01')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should bulk mark notifications as read', async () => {
      const result = await service.markAllAsRead('store-01', 'user-01');

      expect(repository.markAllAsRead).toHaveBeenCalledWith('store-01', 'user-01');
      expect(result.markedReadCount).toBe(2);
    });
  });

  describe('preferences', () => {
    it('should get and update preferences', async () => {
      const prefs = await service.getPreferences('user-01', 'store-01');
      expect(prefs.inAppEnabled).toBe(true);

      const updateDto: UpdateNotificationPreferencesDto = { emailEnabled: true };
      const updated = await service.updatePreferences('user-01', 'store-01', updateDto);
      expect(updated).toBeDefined();
    });
  });

  describe('deviceTokens', () => {
    it('should register and unregister device tokens', async () => {
      const dto: RegisterDeviceTokenDto = {
        expoPushToken: 'ExponentPushToken[123]',
        platform: 'ios',
      };

      const regRes = await service.registerDeviceToken(dto, 'store-01', 'user-01');
      expect(regRes.success).toBe(true);

      const unregRes = await service.unregisterDeviceToken('ExponentPushToken[123]', 'store-01', 'user-01');
      expect(unregRes.success).toBe(true);
    });
  });
});
