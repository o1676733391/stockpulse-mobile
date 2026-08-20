export class DeviceTokenEntity {
  id!: string;
  userId!: string;
  storeId!: string;
  expoPushToken!: string;
  platform!: 'ios' | 'android';
  appVersion?: string;
  isActive!: boolean;
  lastUsedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
