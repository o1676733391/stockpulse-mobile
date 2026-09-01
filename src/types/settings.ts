import { UserRole } from './rbac';

export type { UserRole };
export type AppThemeMode = 'system' | 'light' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarText: string;
  storeId: string;
  storeName: string;
  biometricsEnabled: boolean;
}

export interface StoreOption {
  id: string;
  name: string;
  address: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  address: string;
  currency: string;
  currencySymbol: string;
  language: string;
  timezone: string;
  countSchedule: 'daily' | 'weekly' | 'monthly';
  defaultUnits: 'metric' | 'imperial';
  bbdAlertDays: number;
  safetyStockMultiplier: number;
}

export interface NotificationChannelPreferences {
  key: string;
  label: string;
  iconName: string;
  push: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  pushGlobal: boolean;
  emailGlobal: boolean;
  channels: NotificationChannelPreferences[];
}

export interface AppearancePreferences {
  themeMode: AppThemeMode;
  compactMode: boolean;
  hapticFeedback: boolean;
}

export interface AppAboutInfo {
  version: string;
  buildNumber: string;
  environment: string;
  restaurantName: string;
}
