export class NotificationPreferenceEntity {
  id!: string;
  userId!: string;
  storeId!: string;
  inAppEnabled!: boolean;
  pushEnabled!: boolean;
  emailEnabled!: boolean;
  lowStockAlerts!: boolean;
  expiringBatches!: boolean;
  poStatusUpdates!: boolean;
  stockCountReminders!: boolean;
  ocrScanCompleted!: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
