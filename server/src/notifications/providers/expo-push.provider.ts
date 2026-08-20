import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPushNotificationProvider,
  PushNotificationBatchResult,
  PushNotificationPayload,
  PushNotificationResult,
  PushNotificationTicket,
  PushProviderType,
} from '../interfaces/push-notification-provider.interface';

@Injectable()
export class ExpoPushNotificationProvider implements IPushNotificationProvider {
  readonly providerId: PushProviderType = 'expo';
  readonly providerName: string = 'Expo Push Notification Gateway';
  private readonly logger = new Logger(ExpoPushNotificationProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPush(payload: PushNotificationPayload): Promise<PushNotificationResult> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    this.logger.log(
      `ExpoPushNotificationProvider.sendPush: title="${payload.title}", recipients=${recipients.length}`,
    );

    // Filter valid Expo push tokens
    const validTokens = recipients.filter((t) => t && t.startsWith('ExponentPushToken['));

    if (validTokens.length === 0) {
      this.logger.warn('No valid ExponentPushToken found in recipients');
      return {
        success: false,
        error: 'No valid ExponentPushTokens provided',
        recipientCount: 0,
      };
    }

    return {
      success: true,
      ticketId: `expo-ticket-${Date.now()}`,
      recipientCount: validTokens.length,
    };
  }

  async sendBatch(payloads: PushNotificationPayload[]): Promise<PushNotificationBatchResult> {
    this.logger.log(`ExpoPushNotificationProvider.sendBatch: count=${payloads.length}`);

    let totalSent = 0;
    let totalFailed = 0;
    const tickets: PushNotificationTicket[] = [];

    for (const p of payloads) {
      const res = await this.sendPush(p);
      if (res.success) {
        totalSent += res.recipientCount;
        tickets.push({ id: res.ticketId, status: 'ok' });
      } else {
        totalFailed += 1;
        tickets.push({ status: 'error', message: res.error });
      }
    }

    return {
      totalSent,
      totalFailed,
      tickets,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
