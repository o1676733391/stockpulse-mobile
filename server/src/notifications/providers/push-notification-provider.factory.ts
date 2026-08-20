import { Injectable } from '@nestjs/common';
import {
  IPushNotificationProvider,
  PushProviderType,
} from '../interfaces/push-notification-provider.interface';
import { ExpoPushNotificationProvider } from './expo-push.provider';
import { MockPushNotificationProvider } from './mock-push.provider';

@Injectable()
export class PushNotificationProviderFactory {
  private readonly providers = new Map<PushProviderType, IPushNotificationProvider>();

  constructor(
    private readonly expoPushProvider: ExpoPushNotificationProvider,
    private readonly mockPushProvider: MockPushNotificationProvider,
  ) {
    this.providers.set('expo', this.expoPushProvider);
    this.providers.set('mock', this.mockPushProvider);
  }

  getProvider(type: PushProviderType = 'expo'): IPushNotificationProvider {
    return this.providers.get(type) || this.mockPushProvider;
  }
}
