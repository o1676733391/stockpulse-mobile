import {
  AppAboutInfo,
  AppearancePreferences,
  NotificationPreferences,
  StoreOption,
  StoreSettings,
  UserProfile,
} from '@/types/settings';

export interface ISettingsService {
  getUserProfile(): Promise<UserProfile>;
  updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  getStoreSettings(): Promise<StoreSettings>;
  updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings>;
  getAvailableStores(): Promise<StoreOption[]>;
  switchStore(storeId: string): Promise<StoreSettings>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  updateNotificationToggle(key: string, channel: 'push' | 'email', value: boolean): Promise<void>;
  updateGlobalNotification(channel: 'push' | 'email', value: boolean): Promise<void>;
  getAppearancePreferences(): Promise<AppearancePreferences>;
  updateAppearancePreferences(pref: Partial<AppearancePreferences>): Promise<AppearancePreferences>;
  getAboutInfo(): Promise<AppAboutInfo>;
}

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'u1',
  name: 'Anna Schmidt',
  email: 'anna@restaurant.de',
  phone: '+49 30 9876 5432',
  role: 'admin',
  avatarText: 'AS',
  storeId: 'store-1',
  storeName: 'Bella Cucina Restaurant',
  biometricsEnabled: true,
};

export const INITIAL_AVAILABLE_STORES: StoreOption[] = [
  { id: 'store-1', name: 'Bella Cucina Restaurant', address: 'Friedrichstraße 42, 10117 Berlin' },
  { id: 'store-2', name: 'Bella Cucina Westend',    address: 'Kurfürstendamm 115, 10711 Berlin' },
  { id: 'store-3', name: 'Bella Cucina Express',    address: 'Alexanderplatz 8, 10178 Berlin' },
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  id: 'store-1',
  name: 'Bella Cucina Restaurant',
  address: 'Friedrichstraße 42, 10117 Berlin',
  currency: 'EUR',
  currencySymbol: '€',
  language: 'English',
  timezone: 'Europe/Berlin (UTC+1)',
  countSchedule: 'daily',
  defaultUnits: 'metric',
  bbdAlertDays: 7,
  safetyStockMultiplier: 1.0,
};

export const INITIAL_NOTIF_PREFERENCES: NotificationPreferences = {
  pushGlobal: true,
  emailGlobal: false,
  channels: [
    { key: 'expiring_soon',       label: 'Expiring Stock',     iconName: 'AlertTriangle', push: true,  email: true  },
    { key: 'low_stock',           label: 'Low Stock',          iconName: 'Package',       push: true,  email: false },
    { key: 'variance',            label: 'Major Variance',     iconName: 'TrendingDown',  push: true,  email: true  },
    { key: 'count_due',           label: 'Stock Count Due',    iconName: 'ClipboardList', push: true,  email: false },
    { key: 'ocr_complete',        label: 'OCR Scan Completed', iconName: 'ScanLine',      push: false, email: false },
    { key: 'po_update',           label: 'PO Recommendations', iconName: 'ShoppingCart',  push: true,  email: false },
    { key: 'goods_receipt_update',label: 'Goods Received',     iconName: 'Truck',         push: true,  email: false },
  ],
};

export const INITIAL_APPEARANCE: AppearancePreferences = {
  themeMode: 'system',
  compactMode: false,
  hapticFeedback: true,
};

export const INITIAL_ABOUT: AppAboutInfo = {
  version: '2.4.1',
  buildNumber: '2026.03.11-rc1',
  environment: 'Production',
  restaurantName: 'Bella Cucina Restaurant',
};

export class MockSettingsService implements ISettingsService {
  private profile: UserProfile = JSON.parse(JSON.stringify(INITIAL_USER_PROFILE));
  private storeSettings: StoreSettings = JSON.parse(JSON.stringify(INITIAL_STORE_SETTINGS));
  private notifPrefs: NotificationPreferences = JSON.parse(JSON.stringify(INITIAL_NOTIF_PREFERENCES));
  private appearance: AppearancePreferences = JSON.parse(JSON.stringify(INITIAL_APPEARANCE));

  async getUserProfile(): Promise<UserProfile> {
    return { ...this.profile };
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    this.profile = { ...this.profile, ...profile };
    return { ...this.profile };
  }

  async getStoreSettings(): Promise<StoreSettings> {
    return { ...this.storeSettings };
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    this.storeSettings = { ...this.storeSettings, ...settings };
    return { ...this.storeSettings };
  }

  async getAvailableStores(): Promise<StoreOption[]> {
    return [...INITIAL_AVAILABLE_STORES];
  }

  async switchStore(storeId: string): Promise<StoreSettings> {
    const store = INITIAL_AVAILABLE_STORES.find((s) => s.id === storeId);
    if (store) {
      this.storeSettings.id = store.id;
      this.storeSettings.name = store.name;
      this.storeSettings.address = store.address;
      this.profile.storeId = store.id;
      this.profile.storeName = store.name;
    }
    return { ...this.storeSettings };
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return JSON.parse(JSON.stringify(this.notifPrefs));
  }

  async updateNotificationToggle(key: string, channel: 'push' | 'email', value: boolean): Promise<void> {
    const target = this.notifPrefs.channels.find((c) => c.key === key);
    if (target) {
      target[channel] = value;
    }
  }

  async updateGlobalNotification(channel: 'push' | 'email', value: boolean): Promise<void> {
    if (channel === 'push') this.notifPrefs.pushGlobal = value;
    if (channel === 'email') this.notifPrefs.emailGlobal = value;
  }

  async getAppearancePreferences(): Promise<AppearancePreferences> {
    return { ...this.appearance };
  }

  async updateAppearancePreferences(pref: Partial<AppearancePreferences>): Promise<AppearancePreferences> {
    this.appearance = { ...this.appearance, ...pref };
    return { ...this.appearance };
  }

  async getAboutInfo(): Promise<AppAboutInfo> {
    return { ...INITIAL_ABOUT };
  }
}

export const settingsService: ISettingsService = new MockSettingsService();
