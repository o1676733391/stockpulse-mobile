import { NotificationsRepository } from '../notifications.repository';
import { NotificationsService } from '../notifications.service';
import { PushNotificationProviderFactory } from '../providers/push-notification-provider.factory';

describe('Notifications - Event Triggers & Push Dispatch Tests', () => {
  let service: NotificationsService;
  let repository: NotificationsRepository;
  let factory: PushNotificationProviderFactory;
  let mockPushProvider: any;

  beforeEach(() => {
    repository = {
      createNotification: jest.fn().mockImplementation((dto, storeId) =>
        Promise.resolve({
          id: `notif-${Date.now()}`,
          storeId,
          userId: dto.userId,
          notificationNumber: 'NOTIF-20260820-0001',
          eventType: dto.eventType,
          urgency: dto.urgency || 'NORMAL',
          title: dto.title,
          message: dto.message,
          metadata: dto.metadata,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      ),
      findActiveTokensForUser: jest.fn().mockResolvedValue(['ExponentPushToken[mock-device-token-123]']),
      getPreferences: jest.fn().mockResolvedValue({
        pushEnabled: true,
        inAppEnabled: true,
        lowStockAlerts: true,
        expiringBatches: true,
        poStatusUpdates: true,
        stockCountReminders: true,
        ocrScanCompleted: true,
      }),
    } as unknown as NotificationsRepository;

    mockPushProvider = {
      sendPush: jest.fn().mockResolvedValue({ success: true, ticketId: 'ticket-exp-01' }),
      sendBatch: jest.fn().mockResolvedValue([{ success: true, ticketId: 'ticket-exp-01' }]),
    };

    factory = {
      getProvider: jest.fn().mockReturnValue(mockPushProvider),
    } as unknown as PushNotificationProviderFactory;

    service = new NotificationsService(repository, factory);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. Low Stock Event Trigger: Should dispatch high priority alert and send push notification', async () => {
    const lowStockPayload = {
      userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
      eventType: 'LOW_STOCK',
      urgency: 'CRITICAL' as const,
      title: 'CRITICAL: Low Stock Warning',
      message: 'Mozzarella Cheese is below reorder point (Remaining: 2.1 kg, Min: 5.0 kg)',
      metadata: { itemId: 'item-mozz-01', remainingStock: 2.1, minThreshold: 5.0 },
    };

    const notif = await service.sendNotification(lowStockPayload, '01915dfa-9012-7000-8000-000000000002');

    expect(notif.title).toContain('Low Stock Warning');
    expect(notif.urgency).toBe('CRITICAL');
    expect(repository.createNotification).toHaveBeenCalledWith(lowStockPayload, '01915dfa-9012-7000-8000-000000000002');
    expect(mockPushProvider.sendPush).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['ExponentPushToken[mock-device-token-123]'],
        title: 'CRITICAL: Low Stock Warning',
      }),
    );
  });

  it('2. Expiration Event Trigger: Should dispatch batch expiry warning for FEFO tracking', async () => {
    const expiryPayload = {
      userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
      eventType: 'EXPIRING_SOON',
      urgency: 'CRITICAL' as const,
      title: 'EXPIRY ALERT: Salmon Fillets Expiring in 2 Days',
      message: 'Batch BAT-SAL-20260818 (5.0 kg) expires on 2026-08-22',
      metadata: { itemId: 'item-sal-01', batchNumber: 'BAT-SAL-20260818', expiryDate: '2026-08-22' },
    };

    const notif = await service.sendNotification(expiryPayload, '01915dfa-9012-7000-8000-000000000002');

    expect(notif.urgency).toBe('CRITICAL');
    expect(repository.createNotification).toHaveBeenCalledWith(expiryPayload, '01915dfa-9012-7000-8000-000000000002');
  });

  it('3. Purchase Order Update Event Trigger: Should notify supplier status changes', async () => {
    const poPayload = {
      userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
      eventType: 'PO_STATUS_CHANGE',
      urgency: 'NORMAL' as const,
      title: 'PO-20260820-001 Approved',
      message: 'Purchase order for Alpine Dairy has been approved and transmitted',
      metadata: { poId: 'po-01', status: 'approved' },
    };

    const notif = await service.sendNotification(poPayload, '01915dfa-9012-7000-8000-000000000002');

    expect(notif.eventType).toBe('PO_STATUS_CHANGE');
    expect(repository.createNotification).toHaveBeenCalledWith(poPayload, '01915dfa-9012-7000-8000-000000000002');
  });

  it('4. Goods Receipt Event Trigger: Should notify warehouse delivery completion', async () => {
    const grPayload = {
      userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
      eventType: 'GOODS_RECEIVED',
      urgency: 'NORMAL' as const,
      title: 'Goods Received: GR-20260820-0001',
      message: '120 units received from Alpine Dairy and added to inventory',
      metadata: { receiptId: 'gr-01', purchaseOrderId: 'po-01', itemsCount: 2 },
    };

    const notif = await service.sendNotification(grPayload, '01915dfa-9012-7000-8000-000000000002');

    expect(notif.eventType).toBe('GOODS_RECEIVED');
    expect(repository.createNotification).toHaveBeenCalledWith(grPayload, '01915dfa-9012-7000-8000-000000000002');
  });

  it('5. Disabled Push Preference: Should not dispatch push if user disabled push in preferences', async () => {
    (repository.getPreferences as jest.Mock).mockResolvedValueOnce({
      pushEnabled: false, // Push disabled
      inAppEnabled: true,
    });

    const payload = {
      userId: '01915dfa-b1c4-7221-9988-51b72e04e001',
      eventType: 'LOW_STOCK',
      urgency: 'NORMAL' as const,
      title: 'Minor notice',
      message: 'Stock notice',
    };

    await service.sendNotification(payload, '01915dfa-9012-7000-8000-000000000002');

    // In-app created, but push skipped
    expect(repository.createNotification).toHaveBeenCalled();
    expect(mockPushProvider.sendPush).not.toHaveBeenCalled();
  });
});
