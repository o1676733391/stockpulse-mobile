import { detectDeviceLanguage } from './detector';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
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

type LanguageChangeListener = (lang: SupportedLanguage) => void;

class I18nManager {
  private currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;
  private listeners: Set<LanguageChangeListener> = new Set();
  private pluralRulesCache: Map<string, Intl.PluralRules> = new Map();

  constructor() {
    this.currentLanguage = detectDeviceLanguage();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (SUPPORTED_LANGUAGES[lang] && this.currentLanguage !== lang) {
      this.currentLanguage = lang;
      this.notifyListeners();
    }
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

    // 3. Fallback to English
    if (!template && this.currentLanguage !== DEFAULT_LANGUAGE) {
      template = this.getNestedValue(CATALOGS[DEFAULT_LANGUAGE], key);
    }

    // 4. Ultimate fallback: key itself
    if (!template) {
      return key;
    }

    // 5. Interpolation
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
}

export const i18n = new I18nManager();
export const t = (key: string, options?: TranslationInterpolation & { count?: number }) => i18n.t(key, options);

export * from './types';
export * from './formatters';
export * from './detector';
