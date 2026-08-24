import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { i18n } from './index';
import {
  LanguageMetadata,
  SupportedLanguage,
  TranslationInterpolation,
} from './types';

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  metadata: LanguageMetadata;
  availableLanguages: LanguageMetadata[];
  t: (key: string, options?: TranslationInterpolation & { count?: number }) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number, decimals?: number) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => i18n.getLanguage());

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLang) => {
      setLanguageState(newLang);
    });
    return unsubscribe;
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    i18n.setLanguage(lang);
  }, []);

  const t = useCallback(
    (key: string, options?: TranslationInterpolation & { count?: number }) => {
      return i18n.t(key, options);
    },
    // We include `language` in dependencies so any component consuming `t` re-evaluates when language changes
    [language]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return i18n.formatNumber(value, options);
    },
    [language]
  );

  const formatCurrency = useCallback(
    (value: number, currency?: string, options?: Intl.NumberFormatOptions) => {
      return i18n.formatCurrency(value, currency, options);
    },
    [language]
  );

  const formatPercent = useCallback(
    (value: number, decimals?: number) => {
      return i18n.formatPercent(value, decimals);
    },
    [language]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return i18n.formatDate(date, options);
    },
    [language]
  );

  const formatTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return i18n.formatTime(date, options);
    },
    [language]
  );

  const formatRelativeTime = useCallback(
    (value: number, unit: Intl.RelativeTimeFormatUnit) => {
      return i18n.formatRelativeTime(value, unit);
    },
    [language]
  );

  const metadata = useMemo(() => i18n.getLanguageMetadata(language), [language]);
  const availableLanguages = useMemo(() => i18n.getAvailableLanguages(), []);
  const isRTL = metadata.direction === 'rtl';

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      metadata,
      availableLanguages,
      t,
      formatNumber,
      formatCurrency,
      formatPercent,
      formatDate,
      formatTime,
      formatRelativeTime,
      isRTL,
    }),
    [
      language,
      setLanguage,
      metadata,
      availableLanguages,
      t,
      formatNumber,
      formatCurrency,
      formatPercent,
      formatDate,
      formatTime,
      formatRelativeTime,
      isRTL,
    ]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside of provider
    return {
      language: i18n.getLanguage(),
      setLanguage: (l) => i18n.setLanguage(l),
      metadata: i18n.getLanguageMetadata(),
      availableLanguages: i18n.getAvailableLanguages(),
      t: (k, opt) => i18n.t(k, opt),
      formatNumber: (v, o) => i18n.formatNumber(v, o),
      formatCurrency: (v, c, o) => i18n.formatCurrency(v, c, o),
      formatPercent: (v, d) => i18n.formatPercent(v, d),
      formatDate: (d, o) => i18n.formatDate(d, o),
      formatTime: (d, o) => i18n.formatTime(d, o),
      formatRelativeTime: (v, u) => i18n.formatRelativeTime(v, u),
      isRTL: false,
    };
  }
  return context;
}
