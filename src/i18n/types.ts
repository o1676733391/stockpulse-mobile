export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'it';

export interface LanguageMetadata {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageMetadata> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export type TranslationInterpolation = Record<string, string | number | boolean | null | undefined>;

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
