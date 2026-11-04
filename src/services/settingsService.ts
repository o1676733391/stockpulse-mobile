import { i18n } from '@/i18n/manager';
import {
  AppAboutInfo,
  AppearancePreferences,
  NotificationPreferences,
  StoreOption,
  StoreSettings,
  UserProfile,
} from '@/types/settings';
import * as SecureStore from 'expo-secure-store';
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

export const DEFAULT_STORES: StoreOption[] = [
  {
    id: '01915dfa-9012-7000-8000-000000000002',
    name: 'Bella Cucina Restaurant',
    address: 'Via Roma 12, 10121 Torino',
  },
  {
    id: 'store-express-001',
    name: 'Bella Cucina Express',
    address: 'Corso Vittorio 45, 10123 Torino',
  },
  {
    id: 'store-central-001',
    name: 'Bella Cucina Central Kitchen',
    address: 'Via Nizza 88, 10126 Torino',
  },
];

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
        storeId: storeId || getActiveStoreId() || '01915dfa-9012-7000-8000-000000000002',
        storeName: storeName || 'StockPulse Kitchen',
        biometricsEnabled: true,
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/users/me', err);
      return {
        id: '01915dfa-9012-7000-8000-000000000001',
        name: 'Anna Schmidt',
        email: 'anna.admin@restaurant.de',
        phone: '+49 30 9876 5432',
        role: 'admin',
        avatarText: 'AS',
        storeId: getActiveStoreId() || '01915dfa-9012-7000-8000-000000000002',
        storeName: 'Bella Cucina Restaurant',
        biometricsEnabled: true,
      };
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

  private localStorePrefs: Record<string, Partial<StoreSettings>> = {};

  private async loadLocalStorePrefs(storeId: string): Promise<void> {
    if (!storeId || this.localStorePrefs[storeId]) return;
    try {
      const raw = await SecureStore.getItemAsync(`stockpulse_store_prefs_${storeId}`);
      if (raw) {
        this.localStorePrefs[storeId] = JSON.parse(raw);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  private async persistLocalStorePrefs(storeId: string): Promise<void> {
    if (!storeId || !this.localStorePrefs[storeId]) return;
    try {
      await SecureStore.setItemAsync(
        `stockpulse_store_prefs_${storeId}`,
        JSON.stringify(this.localStorePrefs[storeId])
      );
    } catch {
      // Non-blocking fallback
    }
  }

  async getStoreSettings(): Promise<StoreSettings> {
    const activeStore = getActiveStoreId() || '01915dfa-9012-7000-8000-000000000002';
    await this.loadLocalStorePrefs(activeStore);
    try {
      const res = await apiClient.get<any>(`/stores/${activeStore}`);
      const data = res?.data !== undefined ? res.data : res;
      if (!data) {
        throw new Error('Store settings unavailable');
      }

      const localPrefs = (activeStore && this.localStorePrefs[activeStore]) || {};
      const currency = data.currency || localPrefs.currency || 'EUR';
      const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;

      const defaultLang = i18n.getLanguage() === 'de' ? 'German' : 'English';
      return {
        id: data.id || activeStore,
        name: data.name || 'Bella Cucina Restaurant',
        address: data.address || `${data.city || ''} ${data.country || ''}`.trim() || 'Via Roma 12, 10121 Torino',
        currency,
        currencySymbol,
        language: localPrefs.language || data.language || defaultLang,
        timezone: data.timezone || localPrefs.timezone || 'Europe/Berlin (UTC+1)',
        countSchedule: localPrefs.countSchedule || data.countSchedule || 'daily',
        defaultUnits: localPrefs.defaultUnits || data.defaultUnits || 'metric',
        bbdAlertDays: Number(localPrefs.bbdAlertDays ?? data.bbdAlertDays ?? 7),
        safetyStockMultiplier: Number(localPrefs.safetyStockMultiplier ?? data.safetyStockMultiplier ?? 1.0),
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/stores/:id [GET]', err);
      const matchedStore = DEFAULT_STORES.find((s) => s.id === activeStore) || DEFAULT_STORES[0];
      const localPrefs = (activeStore && this.localStorePrefs[activeStore]) || {};
      const defaultLang = i18n.getLanguage() === 'de' ? 'German' : 'English';
      return {
        id: matchedStore.id,
        name: localPrefs.name || matchedStore.name,
        address: localPrefs.address || matchedStore.address,
        currency: localPrefs.currency || 'EUR',
        currencySymbol: '€',
        language: localPrefs.language || defaultLang,
        timezone: localPrefs.timezone || 'Europe/Berlin (UTC+1)',
        countSchedule: localPrefs.countSchedule || 'daily',
        defaultUnits: localPrefs.defaultUnits || 'metric',
        bbdAlertDays: Number(localPrefs.bbdAlertDays ?? 7),
        safetyStockMultiplier: Number(localPrefs.safetyStockMultiplier ?? 1.0),
      };
    }
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const activeStore = getActiveStoreId() || '01915dfa-9012-7000-8000-000000000002';
    try {
      if (settings.language) {
        i18n.setLanguageFromCodeOrLabel(settings.language);
      }
      // Only send fields accepted by UpdateStoreDto:
      // name, address, city, country, postalCode, phone, email, currency, timezone
      const payload: Record<string, any> = {};
      if (settings.name !== undefined) payload.name = settings.name;
      if (settings.address !== undefined) payload.address = settings.address;
      if (settings.currency !== undefined) payload.currency = settings.currency;
      if (settings.timezone !== undefined) {
        payload.timezone = settings.timezone.replace(/\s*\(UTC.*?\)\s*/g, '').trim() || settings.timezone;
      }

      let data: any = {};
      if (Object.keys(payload).length > 0 && activeStore) {
        const res = await apiClient.patch<any>(`/stores/${activeStore}`, payload);
        data = res?.data !== undefined ? res.data : res;
      }

      // Persist client-side operational preferences
      if (activeStore) {
        this.localStorePrefs[activeStore] = {
          ...(this.localStorePrefs[activeStore] || {}),
          ...settings,
        };
        await this.persistLocalStorePrefs(activeStore);
      }

      const localPrefs = (activeStore && this.localStorePrefs[activeStore]) || {};
      const currency = data.currency || settings.currency || localPrefs.currency || 'EUR';
      const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;

      return {
        id: data.id || activeStore,
        name: data.name || settings.name || 'Bella Cucina Restaurant',
        address: data.address || settings.address || '',
        currency,
        currencySymbol,
        language: localPrefs.language || settings.language || 'English',
        timezone: data.timezone || settings.timezone || localPrefs.timezone || 'Europe/Berlin (UTC+1)',
        countSchedule: localPrefs.countSchedule || settings.countSchedule || 'daily',
        defaultUnits: localPrefs.defaultUnits || settings.defaultUnits || 'metric',
        bbdAlertDays: Number(localPrefs.bbdAlertDays ?? settings.bbdAlertDays ?? 7),
        safetyStockMultiplier: Number(localPrefs.safetyStockMultiplier ?? settings.safetyStockMultiplier ?? 1.0),
      };
    } catch (err) {
      logDebugFallback('SettingsService', '/stores/:id [PATCH]', err);
      if (activeStore) {
        this.localStorePrefs[activeStore] = {
          ...(this.localStorePrefs[activeStore] || {}),
          ...settings,
        };
        await this.persistLocalStorePrefs(activeStore);
      }
      const matchedStore = DEFAULT_STORES.find((s) => s.id === activeStore) || DEFAULT_STORES[0];
      const localPrefs = (activeStore && this.localStorePrefs[activeStore]) || {};
      return {
        id: matchedStore.id,
        name: settings.name || localPrefs.name || matchedStore.name,
        address: settings.address || localPrefs.address || matchedStore.address,
        currency: settings.currency || localPrefs.currency || 'EUR',
        currencySymbol: '€',
        language: settings.language || localPrefs.language || 'English',
        timezone: settings.timezone || localPrefs.timezone || 'Europe/Berlin (UTC+1)',
        countSchedule: settings.countSchedule || localPrefs.countSchedule || 'daily',
        defaultUnits: settings.defaultUnits || localPrefs.defaultUnits || 'metric',
        bbdAlertDays: Number(settings.bbdAlertDays ?? localPrefs.bbdAlertDays ?? 7),
        safetyStockMultiplier: Number(settings.safetyStockMultiplier ?? localPrefs.safetyStockMultiplier ?? 1.0),
      };
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

      if (rawList.length === 0) return DEFAULT_STORES;

      return rawList.map((s: any) => ({
        id: s.id,
        name: s.name || 'Store Location',
        address: s.address || `${s.city || ''} ${s.country || ''}`.trim() || 'Store Location',
      }));
    } catch (err) {
      logDebugFallback('SettingsService', '/stores', err);
      return DEFAULT_STORES;
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
