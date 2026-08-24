import { NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../notifications.repository';
import { NotificationsService } from '../notifications.service';
import { PushNotificationProviderFactory } from '../providers/push-notification-provider.factory';

describe('Notifications - Lifecycle, Unread States & Preferences Tests', () => {
  let service: NotificationsService;
  let repository: NotificationsRepository;
  let factory: PushNotificationProviderFactory;
  let mockPushProvider: any;

  const mockNotification = {
    id: '01915dfa-b1c4-7221-9988-51b72e04e099',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
    notificationNumber: 'NOTIF-20260820-0001',
    eventType: 'LOW_STOCK',
    title: 'Low Stock Alert: Whole Milk',
    message: 'Physical stock (4.5 L) is below safety threshold (10.0 L)',
    urgency: 'CRITICAL' as const,
    metadata: { itemId: 'item-01', currentStock: 4.5, minThreshold: 10.0 },
    isRead: false,
    readAt: undefined,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repository = {
      findNotifications: jest.fn().mockResolvedValue({
        data: [mockNotification],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
      getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 1, criticalCount: 1 }),
      markAsRead: jest.fn().mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date().toISOString(),
      }),
      markAllAsRead: jest.fn().mockResolvedValue(5),
      getPreferences: jest.fn().mockResolvedValue({
        userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
        storeId: '01915dfa-9012-7000-8000-000000000002',
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
      }),
      updatePreferences: jest.fn().mockResolvedValue({
        userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
        storeId: '01915dfa-9012-7000-8000-000000000002',
        inAppEnabled: true,
        pushEnabled: false,
        emailEnabled: true,
        lowStockAlerts: true,
        expiringBatches: false,
        poStatusUpdates: true,
        stockCountReminders: true,
        ocrScanCompleted: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '06:00',
        updatedAt: new Date().toISOString(),
      }),
      createNotification: jest.fn().mockResolvedValue(mockNotification),
      findActiveTokensForUser: jest.fn().mockResolvedValue([]),
    } as unknown as NotificationsRepository;

    mockPushProvider = {
      sendPush: jest.fn().mockResolvedValue({ success: true, ticketId: 'ticket-123' }),
    };

    factory = {
      getProvider: jest.fn().mockReturnValue(mockPushProvider),
    } as unknown as PushNotificationProviderFactory;

    service = new NotificationsService(repository, factory);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Creation & Querying with Tenant Store Isolation', () => {
    it('should create in-app notification for active store context', async () => {
      const dto = {
        userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
        eventType: 'LOW_STOCK',
        urgency: 'CRITICAL' as const,
        title: 'Low Stock Alert: Whole Milk',
        message: 'Physical stock is below threshold',
        metadata: { itemId: 'item-01' },
      };

      const notif = await service.sendNotification(dto, '01915dfa-9012-7000-8000-000000000002');

      expect(notif.id).toBe('01915dfa-b1c4-7221-9988-51b72e04e099');
      expect(notif.storeId).toBe('01915dfa-9012-7000-8000-000000000002');
      expect(repository.createNotification).toHaveBeenCalledWith(dto, '01915dfa-9012-7000-8000-000000000002');
    });

    it('should list paginated notifications filtered by store and user', async () => {
      const result = await service.findNotifications(
        { page: 1, limit: 10 },
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(repository.findNotifications).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );
    });

    it('should retrieve unread notification count badge for store', async () => {
      const badge = await service.getUnreadCount(
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );

      expect(badge.unreadCount).toBe(1);
      expect(repository.getUnreadCount).toHaveBeenCalledWith(
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );
    });
  });

  describe('2. Read & Unread Status Transitions', () => {
    it('should mark single notification as read', async () => {
      const readNotif = await service.markAsRead(
        '01915dfa-b1c4-7221-9988-51b72e04e099',
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );

      expect(readNotif.isRead).toBe(true);
      expect(readNotif.readAt).toBeDefined();
      expect(repository.markAsRead).toHaveBeenCalledWith(
        '01915dfa-b1c4-7221-9988-51b72e04e099',
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );
    });

    it('should mark all unread notifications in store as read in batch', async () => {
      const batchResult = await service.markAllAsRead(
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );

      expect(batchResult.success).toBe(true);
      expect(batchResult.markedReadCount).toBe(5);
      expect(repository.markAllAsRead).toHaveBeenCalledWith(
        '01915dfa-9012-7000-8000-000000000002',
        '01915dfa-b1c4-7221-9988-51b72e04e001',
      );
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      (repository.markAsRead as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.markAsRead('notif-ghost', '01915dfa-9012-7000-8000-000000000002', '01915dfa-b1c4-7221-9988-51b72e04e001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. User Notification Preferences', () => {
    it('should get current user channel and category preferences', async () => {
      const prefs = await service.getPreferences(
        '01915dfa-b1c4-7221-9988-51b72e04e001',
        '01915dfa-9012-7000-8000-000000000002',
      );

      expect(prefs.inAppEnabled).toBe(true);
      expect(prefs.pushEnabled).toBe(true);
      expect(prefs.quietHoursStart).toBe('22:00');
    });

    it('should update user channel preferences and quiet hours', async () => {
      const updateDto = {
        pushEnabled: false,
        emailEnabled: true,
        expiringBatches: false,
        quietHoursStart: '23:00',
        quietHoursEnd: '06:00',
      };

      const updated = await service.updatePreferences(
        '01915dfa-b1c4-7221-9988-51b72e04e001',
        '01915dfa-9012-7000-8000-000000000002',
        updateDto,
      );

      expect(updated.pushEnabled).toBe(false);
      expect(updated.emailEnabled).toBe(true);
      expect(updated.expiringBatches).toBe(false);
      expect(repository.updatePreferences).toHaveBeenCalledWith(
        '01915dfa-b1c4-7221-9988-51b72e04e001',
        '01915dfa-9012-7000-8000-000000000002',
        updateDto,
      );
    });
  });
});
