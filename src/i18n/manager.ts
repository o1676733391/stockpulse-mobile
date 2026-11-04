import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { detectDeviceLanguage } from './detector';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTimestampRelative,
  formatTime,
  getIntlLocale,
} from './formatters';
import {
  DEFAULT_LANGUAGE,
  LanguageMetadata,
  PluralCategory,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  TranslationInterpolation,
} from './types';

// Translation catalogs
import deCatalog from '../locales/de/common.json';
import enCatalog from '../locales/en/common.json';
import esCatalog from '../locales/es/common.json';
import frCatalog from '../locales/fr/common.json';
import itCatalog from '../locales/it/common.json';

const CATALOGS: Record<SupportedLanguage, any> = {
  en: enCatalog,
  de: deCatalog,
  fr: frCatalog,
  es: esCatalog,
  it: itCatalog,
};

const LANGUAGE_STORAGE_KEY = 'stockpulse_app_language_v1';

type LanguageChangeListener = (lang: SupportedLanguage) => void;

export function resolveSupportedLanguage(input?: string | null): SupportedLanguage | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (SUPPORTED_LANGUAGES[clean as SupportedLanguage]) {
    return clean as SupportedLanguage;
  }
  const prefix = clean.split(/[-_\s(]/)[0] as SupportedLanguage;
  if (SUPPORTED_LANGUAGES[prefix]) {
    return prefix;
  }
  if (clean.includes('german') || clean.includes('deutsch')) return 'de';
  if (clean.includes('english') || clean.includes('englisch')) return 'en';
  if (clean.includes('french') || clean.includes('français') || clean.includes('französisch')) return 'fr';
  if (clean.includes('spanish') || clean.includes('español') || clean.includes('spanisch')) return 'es';
  if (clean.includes('italian') || clean.includes('italiano') || clean.includes('italienisch')) return 'it';
  return null;
}

class I18nManager {
  private currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;
  private listeners: Set<LanguageChangeListener> = new Set();
  private pluralRulesCache: Map<string, Intl.PluralRules> = new Map();
  private hasExplicitUserSelection = false;
  private initPromise: Promise<SupportedLanguage> | null = null;

  constructor() {
    this.currentLanguage = detectDeviceLanguage();
    void this.init();
  }

  public async init(): Promise<SupportedLanguage> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          const resolved = resolveSupportedLanguage(saved);
          if (resolved) {
            this.currentLanguage = resolved;
            this.hasExplicitUserSelection = true;
          }
        } else {
          const saved = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
          const resolved = resolveSupportedLanguage(saved);
          if (resolved) {
            this.hasExplicitUserSelection = true;
            if (this.currentLanguage !== resolved) {
              this.currentLanguage = resolved;
              this.notifyListeners();
            }
          }
        }
      } catch (err) {
        console.warn('[I18nManager] Failed to load saved language:', err);
      }
      return this.currentLanguage;
    })();

    return this.initPromise;
  }

  private loadSavedLanguage(): void {
    void this.init();
  }

  private persistLanguage(lang: SupportedLanguage): void {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } else {
        void SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang).catch((err) => {
          console.warn('[I18nManager] SecureStore.setItemAsync error:', err);
        });
      }
    } catch (err) {
      console.warn('[I18nManager] Storage write error:', err);
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public hasUserSelectedLanguage(): boolean {
    return this.hasExplicitUserSelection;
  }

  public setLanguage(lang: SupportedLanguage): void {
    const resolved = resolveSupportedLanguage(lang) || (SUPPORTED_LANGUAGES[lang] ? lang : null);
    if (resolved) {
      this.hasExplicitUserSelection = true;
      this.persistLanguage(resolved);
      if (this.currentLanguage !== resolved) {
        this.currentLanguage = resolved;
        this.notifyListeners();
      }
    }
  }

  public setLanguageFromCodeOrLabel(codeOrLabel: string): SupportedLanguage {
    const resolved = resolveSupportedLanguage(codeOrLabel) || this.currentLanguage;
    this.setLanguage(resolved);
    return resolved;
  }

  public getLanguageMetadata(lang: SupportedLanguage = this.currentLanguage): LanguageMetadata {
    return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  }

  public getAvailableLanguages(): LanguageMetadata[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLanguage);
      } catch (err) {
        console.error('[i18n] Error in language change listener:', err);
      }
    });
  }

  private getPluralCategory(count: number, lang: SupportedLanguage): PluralCategory {
    const locale = getIntlLocale(lang);
    if (!this.pluralRulesCache.has(locale)) {
      try {
        this.pluralRulesCache.set(locale, new Intl.PluralRules(locale));
      } catch {
        return count === 1 ? 'one' : 'other';
      }
    }
    return (this.pluralRulesCache.get(locale)?.select(count) as PluralCategory) || (count === 1 ? 'one' : 'other');
  }

  private getNestedValue(obj: any, path: string): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Translate a key with optional interpolation and pluralization support.
   */
  public t(key: string, options?: TranslationInterpolation & { count?: number }): string {
    if (!key) return '';

    let template: string | undefined;

    // 1. Pluralization check if count is supplied
    if (options && typeof options.count === 'number') {
      const category = this.getPluralCategory(options.count, this.currentLanguage);
      const pluralKey = `${key}_${category}`;

      // Try current language with plural key
      template = this.getNestedValue(CATALOGS[this.currentLanguage], pluralKey);

      // Fallback: plural key in English
      if (!template && this.currentLanguage !== DEFAULT_LANGUAGE) {
        template = this.getNestedValue(CATALOGS[DEFAULT_LANGUAGE], pluralKey);
      }

      // Fallback: standard 'other' plural key
      if (!template) {
        template = this.getNestedValue(CATALOGS[this.currentLanguage], `${key}_other`);
      }
      if (!template && this.currentLanguage !== DEFAULT_LANGUAGE) {
        template = this.getNestedValue(CATALOGS[DEFAULT_LANGUAGE], `${key}_other`);
      }
    }

    // 2. Standard key lookup
    if (!template) {
      template = this.getNestedValue(CATALOGS[this.currentLanguage], key);
    }

    // 3. Fallback to options.defaultValue if provided before falling back to English
    if (!template && options && options.defaultValue !== undefined && options.defaultValue !== null && this.currentLanguage === DEFAULT_LANGUAGE) {
      template = String(options.defaultValue);
    }

    // 4. Fallback to English
    if (!template && this.currentLanguage !== DEFAULT_LANGUAGE) {
      template = this.getNestedValue(CATALOGS[DEFAULT_LANGUAGE], key);
    }

    // 5. Fallback to options.defaultValue
    if (!template && options && options.defaultValue !== undefined && options.defaultValue !== null) {
      template = String(options.defaultValue);
    }

    // 6. Ultimate fail-safe: Humanized text (never raw dotted code paths in production UI)
    if (!template) {
      if (__DEV__) {
        console.warn(`[i18n] Missing translation key in catalog: "${key}" (lang: ${this.currentLanguage})`);
      }
      const leaf = key.split('.').pop() || key;
      const humanized = leaf
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b(Label|Text|Title|Desc|Placeholder|Button|Header)\b/gi, '')
        .trim();
      return humanized.charAt(0).toUpperCase() + humanized.slice(1);
    }

    // 7. Interpolation
    if (options) {
      return template.replace(/\{\{\s*(\w+)\s*\}\}|\{\s*(\w+)\s*\}/g, (_, k1, k2) => {
        const k = k1 || k2;
        const val = options[k];
        return val !== undefined && val !== null ? String(val) : '';
      });
    }

    return template;
  }

  // Locale-aware formatting methods
  public formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, this.currentLanguage, options);
  }

  public formatCurrency(value: number, currency: string = 'EUR', options?: Intl.NumberFormatOptions): string {
    return formatCurrency(value, currency, this.currentLanguage, options);
  }

  public formatPercent(value: number, decimals: number = 1): string {
    return formatPercent(value, this.currentLanguage, decimals);
  }

  public formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    return formatDate(date, this.currentLanguage, options);
  }

  public formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    return formatTime(date, this.currentLanguage, options);
  }

  public formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    return formatRelativeTime(value, unit, this.currentLanguage);
  }

  public formatTimestampRelative(timestamp: number): string {
    return formatTimestampRelative(timestamp, this.currentLanguage);
  }
}

export const i18n = new I18nManager();
export const t = (key: string, options?: TranslationInterpolation & { count?: number }) => i18n.t(key, options);
export const setLanguageFromCodeOrLabel = (codeOrLabel: string) => i18n.setLanguageFromCodeOrLabel(codeOrLabel);

