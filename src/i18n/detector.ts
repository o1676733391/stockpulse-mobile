import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage } from './types';

/**
 * Detects device language from Intl / navigator / system settings.
 * Falls back to DEFAULT_LANGUAGE ('en') if unsupported.
 */
export function detectDeviceLanguage(): SupportedLanguage {
  try {
    let rawLocale = '';

    // 1. Check browser / React Native navigator
    if (typeof navigator !== 'undefined' && navigator.language) {
      rawLocale = navigator.language;
    }

    // 2. Check Intl.DateTimeFormat
    if (!rawLocale && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      rawLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    }

    if (rawLocale) {
      // Extract 2-letter language code (e.g. 'de-DE' -> 'de', 'fr-CA' -> 'fr')
      const langCode = rawLocale.toLowerCase().split(/[-_]/)[0] as SupportedLanguage;
      if (SUPPORTED_LANGUAGES[langCode]) {
        return langCode;
      }
    }
  } catch {
    // Fallback on any environment reading issue
  }

  return DEFAULT_LANGUAGE;
}
