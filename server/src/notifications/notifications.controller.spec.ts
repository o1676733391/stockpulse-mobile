import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationPreferencesResponseDto,
  NotificationResponseDto,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockNotif: NotificationResponseDto = {
    id: 'notif-01',
    storeId: 'store-01',
    userId: 'user-01',
    notificationNumber: 'NOTIF-01',
    eventType: 'LOW_STOCK',
    title: 'Low Stock',
    message: 'Milk is low',
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
    const mockService = {
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
      getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 1, criticalCount: 1 }),
      markAsRead: jest.fn().mockResolvedValue({ ...mockNotif, isRead: true }),
      markAllAsRead: jest.fn().mockResolvedValue({ success: true, markedReadCount: 2 }),
      getPreferences: jest.fn().mockResolvedValue(mockPrefs),
      updatePreferences: jest.fn().mockResolvedValue(mockPrefs),
      registerDeviceToken: jest.fn().mockResolvedValue({ success: true }),
      unregisterDeviceToken: jest.fn().mockResolvedValue({ success: true }),
      sendNotification: jest.fn().mockResolvedValue(mockNotif),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findNotifications', () => {
    it('should return paginated notifications', async () => {
      const result = await controller.findNotifications({ page: 1, limit: 10 }, 'store-01', 'user-01');
      expect(service.findNotifications).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'store-01', 'user-01');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await controller.markAsRead('notif-01', 'store-01', 'user-01');
      expect(service.markAsRead).toHaveBeenCalledWith('notif-01', 'store-01', 'user-01');
      expect(result.isRead).toBe(true);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const result = await controller.getPreferences('user-01', 'store-01');
      expect(service.getPreferences).toHaveBeenCalledWith('user-01', 'store-01');
      expect(result.inAppEnabled).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('should dispatch notification', async () => {
      const dto: SendNotificationDto = {
        eventType: 'ALERT',
        title: 'Alert',
        message: 'Message',
      };
      const result = await controller.sendNotification(dto, 'store-01');
      expect(service.sendNotification).toHaveBeenCalledWith(dto, 'store-01');
      expect(result.id).toBe('notif-01');
    });
  });
});
