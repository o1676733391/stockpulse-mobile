export type NotificationUrgency = 'NORMAL' | 'CRITICAL';

export class NotificationEntity {
  id!: string;
  storeId!: string;
  userId?: string;
  notificationNumber!: string;
  eventType!: string;
  title!: string;
  message!: string;
  urgency!: NotificationUrgency;
  route?: string;
  metadata?: Record<string, unknown>;
  isRead!: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt!: Date;
}
