# StockPulse Mobile - Internationalization (i18n) Developer Guide

## 1. Overview & Architecture

StockPulse employs a **centralized, extensible internationalization architecture** supporting multi-locale restaurant and food & beverage operations. All user-facing strings are stored in externalized JSON resource files, loaded via a reactive singleton manager, and served to React Native components through the `useI18n()` context hook.

### Supported Locales & Metadata

| Code | Language | Native Name | Region / Locale | Default Currency | Date Format |
|---|---|---|---|---|---|
| `en` | English | English | `en-US` | EUR (€) / USD ($) | `MM/DD/YYYY` |
| `de` | German | Deutsch | `de-DE` | EUR (€) | `DD.MM.YYYY` |
| `fr` | French | Français | `fr-FR` | EUR (€) | `DD/MM/YYYY` |
| `es` | Spanish | Español | `es-ES` | EUR (€) | `DD/MM/YYYY` |
| `it` | Italian | Italiano | `it-IT` | EUR (€) | `DD/MM/YYYY` |

---

## 2. Directory Structure

```
fnb-mobile/
├── src/
│   ├── i18n/
│   │   ├── types.ts           # Types, SupportedLanguage, Metadata
│   │   ├── formatters.ts      # Number, Currency, Date, Relative formatters
│   │   ├── detector.ts        # Device locale detection
│   │   ├── index.ts           # I18nManager singleton (plurals, fallback, interpolation)
│   │   └── I18nContext.tsx    # React Context & useI18n() hook
│   └── locales/
│       ├── en/common.json     # Master English translation catalog
│       ├── de/common.json     # German translation catalog
│       ├── fr/common.json     # French translation catalog
│       ├── es/common.json     # Spanish translation catalog
│       └── it/common.json     # Italian translation catalog
├── scripts/
│   ├── check-i18n.js          # Automated schema parity & interpolation linter
│   └── test-i18n-unit.js      # Unit tests for translation resolution & formatters
└── docs/
    └── i18n/
        ├── I18N_GUIDE.md
        └── I18N_IMPLEMENTATION_REPORT.md
```

---

## 3. Core Principles & Usage

### 3.1 Using Translations in Components

Import `useI18n` from `@/i18n/I18nContext`:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '@/i18n/I18nContext';

export function MyComponent() {
  const { t, formatCurrency, formatDate } = useI18n();

  return (
    <View>
      {/* Simple key lookup */}
      <Text>{t('inventory.title')}</Text>

      {/* Dynamic variable interpolation */}
      <Text>{t('dashboard.welcome', { name: 'Alessandro' })}</Text>

      {/* Pluralization based on count */}
      <Text>{t('inventory.itemCount', { count: 12 })}</Text>

      {/* Locale-aware formatting */}
      <Text>{formatCurrency(1248.50)}</Text>
      <Text>{formatDate(new Date())}</Text>
    </View>
  );
}
```

### 3.2 Pluralization

StockPulse uses `Intl.PluralRules` mapped to CLDR plural categories (`_one`, `_other`, `_few`, `_many`).

In locale catalogs:
```json
{
  "inventory": {
    "itemCount_one": "{{count}} item",
    "itemCount_other": "{{count}} items",
    "daysRemaining_one": "Expires in 1 day",
    "daysRemaining_other": "Expires in {{count}} days"
  }
}
```

Usage:
```ts
t('inventory.itemCount', { count: 1 });  // "1 item" (or "1 Artikel")
t('inventory.itemCount', { count: 5 });  // "5 items" (or "5 Artikel")
```

### 3.3 Variable Interpolation

Use double curly braces `{{varName}}`:
```json
{
  "settings": {
    "version": "Version {{version}} (Build {{build}})"
  }
}
```

Usage:
```ts
t('settings.version', { version: '1.2.0', build: '1048' });
// "Version 1.2.0 (Build 1048)"
```

### 3.4 Fallback Guarantee

If a translation key is missing in a non-English language catalog:
1. The engine searches the target language catalog.
2. If not found, it immediately resolves from the master English (`en`) catalog.
3. If not found in English either, it returns the key string itself (`"missing.key.name"`).
4. The application **never throws, crashes, or returns `undefined`/`null`**.

---

## 4. OCR & Vision Model Language Independence

StockPulse's Gemini OCR architecture processes receipts, invoices, and POS reports independently of the user interface language:
1. **Document Recognition**: The vision provider extracts universal structure (item name, article number, quantity, prices, taxes) regardless of whether the receipt is in German, Italian, or French.
2. **Recipe / BOM Mapping**: Extracted lines are mapped against the store's canonical recipe catalog by SKU/ArtNr.
3. **UI Display**: The results and review screens render labels and actions using the user's active UI locale while preserving the raw receipt transcript.

---

## 5. How to Add a New Language (e.g., Dutch `nl` or Portuguese `pt`)

Adding a 6th language requires **zero changes to business logic or screens**:

### Step 1: Add Language Code to Types
In `src/i18n/types.ts`:
```ts
export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageMetadata> = {
  // ... existing languages
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    locale: 'nl-NL',
    direction: 'ltr',
    defaultCurrency: 'EUR',
  },
};
```

### Step 2: Create Locale Catalog
Create `src/locales/nl/common.json` by copying `src/locales/en/common.json` and translating the values.

### Step 3: Register Locale in Manager
In `src/i18n/index.ts`:
```ts
import nl from '../locales/nl/common.json';

// In loadTranslations():
this.translations.set('nl', nl);
```

### Step 4: Verify with Linter & Test Suite
Run:
```bash
npm run i18n:check
npm run test:i18n
```
Once the checks pass with 0 missing keys, the new language will automatically appear in Settings > Language!

---

## 6. Automated Validation Commands

- `npm run i18n:check`: Runs the static translation completeness linter (`scripts/check-i18n.js`).
- `npm run test:i18n`: Runs the full i18n unit test suite (`scripts/test-i18n-unit.js`).
