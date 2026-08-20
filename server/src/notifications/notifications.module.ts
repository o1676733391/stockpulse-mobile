import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { ExpoPushNotificationProvider } from './providers/expo-push.provider';
import { MockPushNotificationProvider } from './providers/mock-push.provider';
import { PushNotificationProviderFactory } from './providers/push-notification-provider.factory';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    PushNotificationProviderFactory,
    ExpoPushNotificationProvider,
    MockPushNotificationProvider,
  ],
  exports: [
    NotificationsService,
    NotificationsRepository,
    PushNotificationProviderFactory,
  ],
})
export class NotificationsModule {}
