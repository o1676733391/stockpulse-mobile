import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExpoPushNotificationProvider } from './expo-push.provider';

describe('ExpoPushNotificationProvider', () => {
  let provider: ExpoPushNotificationProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpoPushNotificationProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    provider = module.get<ExpoPushNotificationProvider>(ExpoPushNotificationProvider);
  });

  it('should be defined with providerId expo', () => {
    expect(provider).toBeDefined();
    expect(provider.providerId).toBe('expo');
  });

  it('should send push notification to valid ExponentPushToken', async () => {
    const result = await provider.sendPush({
      to: 'ExponentPushToken[mock-token-xyz]',
      title: 'Low Stock Alert',
      body: 'Milk is low',
    });

    expect(result.success).toBe(true);
    expect(result.recipientCount).toBe(1);
    expect(result.ticketId).toBeDefined();
  });

  it('should reject invalid non-Expo push token format', async () => {
    const result = await provider.sendPush({
      to: 'invalid-device-token',
      title: 'Test',
      body: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.recipientCount).toBe(0);
  });

  it('should handle batch push notifications', async () => {
    const batchResult = await provider.sendBatch([
      {
        to: 'ExponentPushToken[token-1]',
        title: 'Batch 1',
        body: 'Body 1',
      },
      {
        to: 'ExponentPushToken[token-2]',
        title: 'Batch 2',
        body: 'Body 2',
      },
    ]);

    expect(batchResult.totalSent).toBe(2);
    expect(batchResult.totalFailed).toBe(0);
    expect(batchResult.tickets).toHaveLength(2);
  });
});
