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

/**
 * Formats a past timestamp into concise relative time based on active language.
 * Examples (de): "Gerade eben", "vor 5 Min.", "vor 2 Std.", "Gestern", "vor 5 Tagen"
 * Examples (en): "Just now", "5m ago", "2h ago", "Yesterday", "5d ago"
 */
export function formatTimestampRelative(
  timestamp: number,
  language: SupportedLanguage = 'en'
): string {
  if (!timestamp || isNaN(timestamp)) {
    return language === 'de' ? 'Heute' : 'Today';
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) {
    return language === 'de' ? 'Gerade eben' : 'Just now';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (language === 'de') {
    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 30) return `vor ${diffDays} Tagen`;
    return formatDate(timestamp, language);
  }

  if (language === 'fr') {
    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 30) return `il y a ${diffDays} j`;
    return formatDate(timestamp, language);
  }

  if (language === 'es') {
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `hace ${diffDays} d`;
    return formatDate(timestamp, language);
  }

  if (language === 'it') {
    if (diffMinutes < 1) return 'Proprio ora';
    if (diffMinutes < 60) return `${diffMinutes} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 30) return `${diffDays} gg fa`;
    return formatDate(timestamp, language);
  }

  // English fallback
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(timestamp, language);
}
