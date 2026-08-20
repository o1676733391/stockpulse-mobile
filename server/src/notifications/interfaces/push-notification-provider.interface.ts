export type PushProviderType = 'expo' | 'fcm' | 'apns' | 'mock';

export interface PushNotificationPayload {
  to: string | string[]; // Expo push token or array of tokens
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  categoryId?: string;
}

export interface PushNotificationTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: Record<string, unknown>;
}

export interface PushNotificationResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  recipientCount: number;
}

export interface PushNotificationBatchResult {
  totalSent: number;
  totalFailed: number;
  tickets: PushNotificationTicket[];
}

/**
 * Provider abstraction interface for push notifications.
 * Decouples the notification service from specific push gateways (Expo, Firebase Cloud Messaging, APNS).
 */
export interface IPushNotificationProvider {
  readonly providerId: PushProviderType;
  readonly providerName: string;

  sendPush(payload: PushNotificationPayload): Promise<PushNotificationResult>;
  sendBatch(payloads: PushNotificationPayload[]): Promise<PushNotificationBatchResult>;
  healthCheck(): Promise<boolean>;
}
