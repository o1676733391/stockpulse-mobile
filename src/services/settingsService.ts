import {
  AppAboutInfo,
  AppearancePreferences,
  NotificationPreferences,
  StoreOption,
  StoreSettings,
  UserProfile,
} from '@/types/settings';
import { apiClient, getActiveStoreId, logDebugFallback, setActiveStoreId } from './apiClient';

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
  id: '',
  name: 'User',
  email: '',
  phone: '',
  role: 'staff',
  avatarText: 'US',
  storeId: '',
  storeName: 'Kitchen Store',
  biometricsEnabled: true,
};

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  id: '',
  name: 'Kitchen Store',
  address: '',
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
    { key: 'expiring_soon',        label: 'Expiring Stock',     iconName: 'AlertTriangle', push: true,  email: true  },
    { key: 'low_stock',            label: 'Low Stock',          iconName: 'Package',       push: true,  email: false },
    { key: 'variance',             label: 'Major Variance',     iconName: 'TrendingDown',  push: true,  email: true  },
    { key: 'count_due',            label: 'Stock Count Due',    iconName: 'ClipboardList', push: true,  email: false },
    { key: 'ocr_complete',         label: 'OCR Scan Completed', iconName: 'ScanLine',      push: false, email: false },
    { key: 'po_update',            label: 'PO Recommendations', iconName: 'ShoppingCart',  push: true,  email: false },
    { key: 'goods_receipt_update', label: 'Goods Received',     iconName: 'Truck',         push: true,  email: false },
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
  restaurantName: 'StockPulse Kitchen',
};

export class RealSettingsService implements ISettingsService {
  private appearance: AppearancePreferences = JSON.parse(JSON.stringify(INITIAL_APPEARANCE));

  private extractInitials(nameOrEmail: string): string {
    const parts = (nameOrEmail || 'US').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (nameOrEmail.slice(0, 2) || 'US').toUpperCase();
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const res = await apiClient.get<any>('/users/me');
      const data = res?.data !== undefined ? res.data : res;
      if (!data) {
        throw new Error('User profile data is unavailable');
      }

      const rawName = data.name || data.email?.split('@')[0] || 'User';
      const initials = this.extractInitials(rawName || data.email);
      const storeId = data.assignedStoreIds?.[0] || data.storeId || getActiveStoreId();

      // Fetch active store name if available
      let storeName = data.storeName || data.store?.name;
      if (!storeName && storeId) {
        try {
          const storeRes = await apiClient.get<any>(`/stores/${storeId}`);
          const storeData = storeRes?.data !== undefined ? storeRes.data : storeRes;
          if (storeData?.name) {
            storeName = storeData.name;
          }
        } catch {
          // Non-blocking fallback
        }
      }

      return {
        id: data.id || 'u1',
        name: rawName,
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'staff',
        avatarText: initials,
        storeId: storeId || 'store-1',
        storeName: storeName || 'StockPulse Kitchen',
        biometricsEnabled: true,
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/users/me', err);
      throw err;
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await apiClient.patch<any>('/users/me', {
        name: profile.name,
        phone: profile.phone,
      });
      const data = res?.data !== undefined ? res.data : res;
      if (!data) {
        throw new Error('Failed to parse updated profile data');
      }

      const rawName = data.name || data.email?.split('@')[0] || 'User';
      const initials = this.extractInitials(rawName || data.email);

      return {
        id: data.id || 'u1',
        name: rawName,
        email: data.email || profile.email || '',
        phone: data.phone || profile.phone || '',
        role: data.role || profile.role || 'staff',
        avatarText: initials,
        storeId: data.assignedStoreIds?.[0] || profile.storeId || getActiveStoreId(),
        storeName: profile.storeName || 'StockPulse Kitchen',
        biometricsEnabled: profile.biometricsEnabled !== false,
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/users/me [PATCH]', err);
      throw err;
    }
  }

  async getStoreSettings(): Promise<StoreSettings> {
    try {
      const activeStore = getActiveStoreId();
      const res = await apiClient.get<any>(`/stores/${activeStore}`);
      const data = res?.data !== undefined ? res.data : res;
      if (!data) {
        throw new Error('Store settings unavailable');
      }

      const currency = data.currency || 'EUR';
      const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;

      return {
        id: data.id || activeStore,
        name: data.name || 'StockPulse Kitchen',
        address: data.address || `${data.city || ''} ${data.country || ''}`.trim() || 'Store Location',
        currency,
        currencySymbol,
        language: data.language || 'English',
        timezone: data.timezone || 'Europe/Berlin (UTC+1)',
        countSchedule: data.countSchedule || 'daily',
        defaultUnits: data.defaultUnits || 'metric',
        bbdAlertDays: Number(data.bbdAlertDays || 7),
        safetyStockMultiplier: Number(data.safetyStockMultiplier || 1.0),
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/stores/:id', err);
      throw err;
    }
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    try {
      const activeStore = getActiveStoreId();
      const res = await apiClient.patch<any>(`/stores/${activeStore}`, {
        name: settings.name,
        address: settings.address,
        currency: settings.currency,
        timezone: settings.timezone,
        bbdAlertDays: settings.bbdAlertDays,
        countSchedule: settings.countSchedule,
        defaultUnits: settings.defaultUnits,
      });
      const data = res?.data !== undefined ? res.data : res;

      const currency = data.currency || settings.currency || 'EUR';
      const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;

      return {
        id: data.id || activeStore,
        name: data.name || settings.name || 'StockPulse Kitchen',
        address: data.address || settings.address || '',
        currency,
        currencySymbol,
        language: settings.language || 'English',
        timezone: data.timezone || settings.timezone || 'Europe/Berlin (UTC+1)',
        countSchedule: settings.countSchedule || 'daily',
        defaultUnits: settings.defaultUnits || 'metric',
        bbdAlertDays: Number(settings.bbdAlertDays || 7),
        safetyStockMultiplier: Number(settings.safetyStockMultiplier || 1.0),
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/stores/:id [PATCH]', err);
      throw err;
    }
  }

  async getAvailableStores(): Promise<StoreOption[]> {
    try {
      const res = await apiClient.get<any>('/stores');
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];

      return rawList.map((s: any) => ({
        id: s.id,
        name: s.name || 'Store Location',
        address: s.address || `${s.city || ''} ${s.country || ''}`.trim() || 'Store Location',
      }));
    } catch (err) {
      logDebugFallback('SettingsService', '/stores', err);
      throw err;
    }
  }

  async switchStore(storeId: string): Promise<StoreSettings> {
    setActiveStoreId(storeId);
    return await this.getStoreSettings();
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const res = await apiClient.get<any>('/notifications/preferences');
      const data = res?.data !== undefined ? res.data : res;
      if (data && typeof data === 'object') {
        return {
          pushGlobal: data.pushGlobal !== undefined ? Boolean(data.pushGlobal) : true,
          emailGlobal: data.emailGlobal !== undefined ? Boolean(data.emailGlobal) : false,
          channels: Array.isArray(data.channels) ? data.channels : INITIAL_NOTIF_PREFERENCES.channels,
        };
      }
      return INITIAL_NOTIF_PREFERENCES;
    } catch (err) {
      logDebugFallback('SettingsService', '/notifications/preferences', err);
      return INITIAL_NOTIF_PREFERENCES;
    }
  }

  async updateNotificationToggle(key: string, channel: 'push' | 'email', value: boolean): Promise<void> {
    try {
      await apiClient.patch('/notifications/preferences', { [key]: { [channel]: value } });
    } catch (err) {
      logDebugFallback('SettingsService', '/notifications/preferences [PATCH]', err);
      throw err;
    }
  }

  async updateGlobalNotification(channel: 'push' | 'email', value: boolean): Promise<void> {
    try {
      await apiClient.patch('/notifications/preferences', { [`${channel}Global`]: value });
    } catch (err) {
      logDebugFallback('SettingsService', '/notifications/preferences [GLOBAL]', err);
      throw err;
    }
  }

  async getAppearancePreferences(): Promise<AppearancePreferences> {
    return { ...this.appearance };
  }

  async updateAppearancePreferences(pref: Partial<AppearancePreferences>): Promise<AppearancePreferences> {
    this.appearance = { ...this.appearance, ...pref };
    return { ...this.appearance };
  }

  async getAboutInfo(): Promise<AppAboutInfo> {
    try {
      const store = await this.getStoreSettings();
      return {
        version: '2.4.1',
        buildNumber: '2026.03.11-rc1',
        environment: 'Production',
        restaurantName: store.name || 'StockPulse Kitchen',
      };
    } catch {
      return { ...INITIAL_ABOUT };
    }
  }
}

export const settingsService: ISettingsService = new RealSettingsService();
