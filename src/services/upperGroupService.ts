import { SupportedLanguage } from '@/i18n/types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type UpperGroupDomain = 'food' | 'drinks' | 'non_food';

export interface UpperGroupDefinition {
  id: string;
  domain: UpperGroupDomain;
  type: UpperGroupDomain;
  isCustom?: boolean;
  labels: Record<SupportedLanguage, string>;
  aliases: string[];
  defaultUnit?: string;
}

export type UpperGroup = UpperGroupDefinition;

const CUSTOM_GROUPS_STORAGE_KEY = 'stockpulse_custom_upper_groups_v1';

export const BUILTIN_UPPER_GROUPS: UpperGroupDefinition[] = [
  {
    id: 'drinks_soft',
    domain: 'drinks',
    type: 'drinks',
    defaultUnit: 'bottle',
    labels: {
      de: 'Alkoholfrei & Softdrinks',
      en: 'Soft Drinks & Water',
      fr: 'Boissons & Sans Alcool',
      es: 'Bebidas y Refrescos',
      it: 'Bevande e Analcolici',
    },
    aliases: [
      'drinks',
      'getränke',
      'getränke & alkoholfrei',
      'drinks & soft drinks',
      'soft drinks',
      'softs',
      'open softs',
      'water',
      'alkoholfreie getränke',
      'beverages',
      'coffee & beverages',
      'kaffee & getränke',
      'smoothies & juices',
      'wasser',
      'saft',
      'juice',
    ],
  },
  {
    id: 'drinks_beer_wine',
    domain: 'drinks',
    type: 'drinks',
    defaultUnit: 'L',
    labels: {
      de: 'Bier, Wein & Sekt',
      en: 'Beer, Wine & Sparkling',
      fr: 'Bière, Vin & Champagne',
      es: 'Cerveza, Vino y Cava',
      it: 'Birra, Vino e Spumante',
    },
    aliases: [
      'beer, wine & sparkling',
      'bier, wein & sekt',
      'beer & cider',
      'wine & spirits',
      'bier',
      'wein',
      'sekt',
      'beer',
      'wine',
      'prosecco',
    ],
  },
  {
    id: 'drinks_spirits_bar',
    domain: 'drinks',
    type: 'drinks',
    defaultUnit: 'L',
    labels: {
      de: 'Spirituosen & Bar',
      en: 'Spirits & Bar',
      fr: 'Spiritueux & Bar',
      es: 'Licores y Coctelería',
      it: 'Distillati e Bar',
    },
    aliases: [
      'spirits & bar',
      'spirituosen & bar',
      'spirituosen',
      'spirits',
      'cocktails & mixed',
      'cocktails',
      'bar',
    ],
  },
  {
    id: 'drinks_hot',
    domain: 'drinks',
    type: 'drinks',
    defaultUnit: 'kg',
    labels: {
      de: 'Kaffee, Tee & Heißgetränke',
      en: 'Coffee, Tea & Hot Drinks',
      fr: 'Café, Thé & Boissons Chaudes',
      es: 'Café, Té y Bebidas Calientes',
      it: 'Caffè, Tè e Bevande Calde',
    },
    aliases: [
      'coffee, tea & hot drinks',
      'kaffee, tee & heißgetränke',
      'hot coffee & espresso',
      'iced coffee & cold brew',
      'tea & chai',
      'kaffee',
      'tee',
      'coffee',
      'tea',
    ],
  },
  {
    id: 'meat',
    domain: 'food',
    type: 'food',
    defaultUnit: 'kg',
    labels: {
      de: 'Fleisch & Geflügel',
      en: 'Meat & Poultry',
      fr: 'Viandes & Volailles',
      es: 'Carnes y Aves',
      it: 'Carne e Pollame',
    },
    aliases: [
      'meat & poultry',
      'fleisch & geflügel',
      'viandes & volailles',
      'carnes y aves',
      'carne e pollame',
      'meat',
      'poultry',
      'fleisch',
      'main course',
      'burgers',
    ],
  },
  {
    id: 'seafood',
    domain: 'food',
    type: 'food',
    defaultUnit: 'kg',
    labels: {
      de: 'Fisch & Meeresfrüchte',
      en: 'Fish & Seafood',
      fr: 'Poissons & Fruits de Mer',
      es: 'Pescados y Mariscos',
      it: 'Pesce e Frutti di Mare',
    },
    aliases: [
      'fish & seafood',
      'fisch & meeresfrüchte',
      'poissons & fruits de mer',
      'pescados y mariscos',
      'pesce e frutti di mare',
      'seafood',
      'fish',
      'fisch',
    ],
  },
  {
    id: 'produce',
    domain: 'food',
    type: 'food',
    defaultUnit: 'kg',
    labels: {
      de: 'Obst, Gemüse & Frische',
      en: 'Fresh Produce & Veg',
      fr: 'Fruits & Légumes Frais',
      es: 'Frutas y Verduras Frescas',
      it: 'Frutta e Verdura Fresca',
    },
    aliases: [
      'fresh produce',
      'fresh produce & vegetables',
      'frische erzeugnisse',
      'frische erzeugnisse & gemüse',
      'fruits & légumes frais',
      'frutas y verduras frescas',
      'frutta e verdura fresca',
      'vegetables',
      'produce',
      'gemüse',
      'obst',
      'salads',
      'starters',
    ],
  },
  {
    id: 'dairy',
    domain: 'food',
    type: 'food',
    defaultUnit: 'L',
    labels: {
      de: 'Molkerei & Eier',
      en: 'Dairy & Eggs',
      fr: 'Produits Laitiers & Œufs',
      es: 'Lácteos y Huevos',
      it: 'Latticini e Uova',
    },
    aliases: [
      'dairy & eggs',
      'molkerei & eier',
      'produits laitiers & œufs',
      'lácteos y huevos',
      'latticini e uova',
      'dairy',
      'molkerei',
      'desserts',
      'breakfast',
    ],
  },
  {
    id: 'pantry',
    domain: 'food',
    type: 'food',
    defaultUnit: 'kg',
    labels: {
      de: 'Trockenlager & Vorrat',
      en: 'Pantry & Dry Goods',
      fr: 'Épicerie & Réserve Sèche',
      es: 'Despensa y Secos',
      it: 'Dispensa e Secco',
    },
    aliases: [
      'pantry & dry goods',
      'trockenlager & vorrat',
      'épicerie & réserve sèche',
      'despensa y secos',
      'dispensa e secco',
      'dry goods',
      'pantry',
      'general',
      'bakery',
      'sides & snacks',
    ],
  },
];

type GroupChangeListener = () => void;

class UpperGroupService {
  private customGroups: UpperGroupDefinition[] = [];
  private listeners: Set<GroupChangeListener> = new Set();
  private initialized = false;

  constructor() {
    this.loadSyncIfPossible();
  }

  private loadSyncIfPossible(): void {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(CUSTOM_GROUPS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.customGroups = parsed;
            this.initialized = true;
          }
        }
      } else {
        void this.loadAsync();
      }
    } catch {
      // ignore storage read error
    }
  }

  public async loadAsync(): Promise<void> {
    if (this.initialized) return;
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(CUSTOM_GROUPS_STORAGE_KEY);
      } else {
        raw = await SecureStore.getItemAsync(CUSTOM_GROUPS_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.customGroups = parsed;
          this.notifyListeners();
        }
      }
      this.initialized = true;
    } catch {
      this.initialized = true;
    }
  }

  private async persist(): Promise<void> {
    try {
      const serialized = JSON.stringify(this.customGroups);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(CUSTOM_GROUPS_STORAGE_KEY, serialized);
      } else {
        await SecureStore.setItemAsync(CUSTOM_GROUPS_STORAGE_KEY, serialized);
      }
    } catch {
      // ignore storage write error
    }
  }

  public subscribe(listener: GroupChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {
        // ignore
      }
    });
  }

  public getAllGroupsSync(): UpperGroupDefinition[] {
    return [...BUILTIN_UPPER_GROUPS, ...this.customGroups];
  }

  public async getAllGroups(): Promise<UpperGroupDefinition[]> {
    await this.loadAsync();
    return this.getAllGroupsSync();
  }

  public getCustomGroups(): UpperGroupDefinition[] {
    return [...this.customGroups];
  }

  public getGroupLabel(
    groupOrIdOrCategory: UpperGroupDefinition | string,
    lang: SupportedLanguage = 'de'
  ): string {
    if (!groupOrIdOrCategory) return '';
    if (typeof groupOrIdOrCategory === 'object') {
      return groupOrIdOrCategory.labels[lang] || groupOrIdOrCategory.labels.en;
    }
    const clean = groupOrIdOrCategory.trim().toLowerCase();
    const all = this.getAllGroupsSync();
    const found = all.find(
      (g) =>
        g.id.toLowerCase() === clean ||
        Object.values(g.labels).some((lbl) => lbl.toLowerCase() === clean) ||
        g.aliases.some((a) => a.toLowerCase() === clean)
    );
    if (found) {
      return found.labels[lang] || found.labels.en;
    }
    return groupOrIdOrCategory;
  }

  public translateCategory(category: string, lang: SupportedLanguage = 'de'): string {
    return this.getGroupLabel(category, lang);
  }

  public resolveGroup(categoryOrId: string): UpperGroupDefinition | undefined {
    if (!categoryOrId) return undefined;
    const clean = categoryOrId.trim().toLowerCase();
    return this.getAllGroupsSync().find(
      (g) =>
        g.id.toLowerCase() === clean ||
        Object.values(g.labels).some((lbl) => lbl.toLowerCase() === clean) ||
        g.aliases.some((a) => a.toLowerCase() === clean)
    );
  }

  /**
   * Matches an item's category string against a selected group ID or localized label
   */
  public matchesGroup(itemCategory: string, selectedGroupIdOrLabel: string): boolean {
    if (!selectedGroupIdOrLabel || selectedGroupIdOrLabel === 'all') return true;
    const itemClean = (itemCategory || '').trim().toLowerCase();
    const selClean = selectedGroupIdOrLabel.trim().toLowerCase();
    if (itemClean === selClean) return true;

    const targetGroup = this.resolveGroup(selectedGroupIdOrLabel);
    const itemGroup = this.resolveGroup(itemCategory);
    if (targetGroup && itemGroup && targetGroup.id === itemGroup.id) {
      return true;
    }
    if (targetGroup) {
      return (
        targetGroup.id.toLowerCase() === itemClean ||
        Object.values(targetGroup.labels).some((l) => l.toLowerCase() === itemClean) ||
        targetGroup.aliases.some((a) => a.toLowerCase() === itemClean)
      );
    }
    return false;
  }

  /**
   * Creates a new user-defined Upper Group (Obergruppe)
   */
  public async addCustomGroup(
    name: string,
    domain: UpperGroupDomain = 'drinks',
    defaultUnit: string = 'bottle'
  ): Promise<UpperGroupDefinition> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Group name is required');
    }

    const existing = this.resolveGroup(trimmed);
    if (existing) {
      return existing;
    }

    const id = `custom_${domain}_${Date.now()}`;
    const newGroup: UpperGroupDefinition = {
      id,
      domain,
      type: domain,
      isCustom: true,
      defaultUnit,
      labels: {
        de: trimmed,
        en: trimmed,
        fr: trimmed,
        es: trimmed,
        it: trimmed,
      },
      aliases: [trimmed.toLowerCase()],
    };

    this.customGroups = [...this.customGroups, newGroup];
    await this.persist();
    this.notifyListeners();
    return newGroup;
  }

  public async removeCustomGroup(id: string): Promise<void> {
    this.customGroups = this.customGroups.filter((g) => g.id !== id);
    await this.persist();
    this.notifyListeners();
  }
}

export const upperGroupService = new UpperGroupService();

