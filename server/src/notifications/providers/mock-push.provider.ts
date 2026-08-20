import { Injectable, Logger } from '@nestjs/common';
import {
  IPushNotificationProvider,
  PushNotificationBatchResult,
  PushNotificationPayload,
  PushNotificationResult,
  PushProviderType,
} from '../interfaces/push-notification-provider.interface';

@Injectable()
export class MockPushNotificationProvider implements IPushNotificationProvider {
  readonly providerId: PushProviderType = 'mock';
  readonly providerName: string = 'Mock Push Notification Provider (Local / Test)';
  private readonly logger = new Logger(MockPushNotificationProvider.name);

  async sendPush(payload: PushNotificationPayload): Promise<PushNotificationResult> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    this.logger.log(`MockPushNotificationProvider.sendPush: "${payload.title}" to ${recipients.length} tokens`);
    return {
      success: true,
      ticketId: `mock-ticket-${Date.now()}`,
      recipientCount: recipients.length,
    };
  }

  async sendBatch(payloads: PushNotificationPayload[]): Promise<PushNotificationBatchResult> {
    return {
      totalSent: payloads.length,
      totalFailed: 0,
      tickets: payloads.map((_, i) => ({ id: `mock-ticket-${i}`, status: 'ok' })),
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
