import { SupportedLanguage } from './types';

const LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

export function getIntlLocale(language: SupportedLanguage): string {
  return LOCALE_MAP[language] || 'en-US';
}

/**
 * Locale-aware number formatting
 */
export function formatNumber(
  value: number,
  language: SupportedLanguage = 'en',
  options?: Intl.NumberFormatOptions
): string {
  if (isNaN(value)) return '0';
  const locale = getIntlLocale(language);
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Locale-aware currency formatting (separates language locale from currency code)
 */
export function formatCurrency(
  value: number,
  currency: string = 'EUR',
  language: SupportedLanguage = 'en',
  options?: Intl.NumberFormatOptions
): string {
  if (isNaN(value)) return '€0.00';
  const locale = getIntlLocale(language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Locale-aware percentage formatting
 */
export function formatPercent(
  value: number,
  language: SupportedLanguage = 'en',
  decimals: number = 1
): string {
  if (isNaN(value)) return '0%';
  const locale = getIntlLocale(language);
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Locale-aware date formatting
 */
export function formatDate(
  date: Date | string | number,
  language: SupportedLanguage = 'en',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const locale = getIntlLocale(language);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Locale-aware time formatting
 */
export function formatTime(
  date: Date | string | number,
  language: SupportedLanguage = 'en',
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const locale = getIntlLocale(language);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Relative time formatting (e.g. "5 minutes ago", "vor 5 Minuten")
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  language: SupportedLanguage = 'en'
): string {
  const locale = getIntlLocale(language);
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return rtf.format(value, unit);
  } catch {
    return `${value} ${unit}`;
  }
}
