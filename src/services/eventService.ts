import { CateringEvent, EventIngredientRequirement, EventMenuItem, EventStatus } from '@/types/events';
import { apiClient, logDebugFallback } from './apiClient';
import { inventoryService } from './inventoryService';
import { recipeService } from './recipeService';

export const INITIAL_EVENTS: CateringEvent[] = [
  {
    id: 'ev-1',
    title: 'Executive Healthcare Summit Dinner',
    date: '14 Mar 2026',
    time: '19:00',
    status: 'upcoming',
    guestCount: 65,
    location: 'Grand Ballroom & Private Dining',
    contactPerson: 'Dr. Michael Brandt',
    contactPhone: '+49 170 9988776',
    notes: 'Plated 3-course dinner. VIP guests arrive at 18:30 for welcome champagne.',
    menuItems: [
      {
        recipeId: 'r1',
        recipeName: 'Menu 1 — Chicken Plate',
        category: 'Main Course',
        portionCount: 40,
        costPerServing: 3.42,
      },
      {
        recipeId: 'r3',
        recipeName: 'Salmon Lunch Special',
        category: 'Fish & Seafood',
        portionCount: 25,
        costPerServing: 8.9,
      },
      {
        recipeId: 'r4',
        recipeName: 'Menu 3 — Mixed Salad',
        category: 'Salads',
        portionCount: 65,
        costPerServing: 2.1,
      },
    ],
    totalEstimatedCost: 495.8,
    ingredientRequirements: [
      {
        itemId: 'i1',
        itemName: 'Chicken Breast',
        requiredQty: 8.0, // 40 portions * 0.20kg
        currentStock: 24.5,
        unit: 'kg',
        shortageQty: 0,
        unitCost: 4.8,
        shortageCost: 0,
        supplierId: 's1',
        supplierName: 'Metro Foods GmbH',
      },
      {
        itemId: 'i2',
        itemName: 'Fresh Salmon',
        requiredQty: 5.5, // 25 portions * 0.22kg
        currentStock: 4.2,
        unit: 'kg',
        shortageQty: 1.3, // Shortage!
        unitCost: 16.2,
        shortageCost: 21.06,
        supplierId: 's2',
        supplierName: 'FreshProduce GmbH',
      },
      {
        itemId: 'i3',
        itemName: 'Potatoes',
        requiredQty: 9.0, // (40*0.15) + (25*0.12)
        currentStock: 48.0,
        unit: 'kg',
        shortageQty: 0,
        unitCost: 0.9,
        shortageCost: 0,
        supplierId: 's1',
        supplierName: 'Metro Foods GmbH',
      },
      {
        itemId: 'i8',
        itemName: 'Romaine Lettuce',
        requiredQty: 7.8, // 65 portions * 0.12kg
        currentStock: 3.1,
        unit: 'kg',
        shortageQty: 4.7, // Shortage!
        unitCost: 2.2,
        shortageCost: 10.34,
        supplierId: 's2',
        supplierName: 'FreshProduce GmbH',
      },
      {
        itemId: 'i7',
        itemName: 'Tomatoes',
        requiredQty: 8.45, // (40*0.05) + (25*0.05) + (65*0.08)
        currentStock: 12.4,
        unit: 'kg',
        shortageQty: 0,
        unitCost: 1.8,
        shortageCost: 0,
        supplierId: 's2',
        supplierName: 'FreshProduce GmbH',
      },
    ],
    hasShortage: true,
    shortageCount: 2,
    totalShortageCost: 31.4,
    createdAt: '08 Mar 2026',
    updatedAt: '10 Mar 2026',
  },
  {
    id: 'ev-2',
    title: 'Spring Tech Meetup & Burger Buffet',
    date: '18 Mar 2026',
    time: '18:00',
    status: 'upcoming',
    guestCount: 80,
    location: 'Terrace Garden & Lounge',
    contactPerson: 'Sarah Hoffman',
    contactPhone: '+49 151 2233445',
    notes: 'Informal standing networking buffet with gourmet burgers and salads.',
    menuItems: [
      {
        recipeId: 'r2',
        recipeName: 'Burger XL',
        category: 'Burgers',
        portionCount: 80,
        costPerServing: 4.18,
      },
      {
        recipeId: 'r4',
        recipeName: 'Menu 3 — Mixed Salad',
        category: 'Salads',
        portionCount: 50,
        costPerServing: 2.1,
      },
    ],
    totalEstimatedCost: 439.4,
    ingredientRequirements: [
      {
        itemId: 'i9',
        itemName: 'Ground Beef',
        requiredQty: 20.0, // 80 * 0.25kg
        currentStock: 18.0,
        unit: 'kg',
        shortageQty: 2.0, // Shortage!
        unitCost: 6.2,
        shortageCost: 12.4,
        supplierId: 's1',
        supplierName: 'Metro Foods GmbH',
      },
      {
        itemId: 'i6',
        itemName: 'Gouda Cheese',
        requiredQty: 5.7, // (80*0.04) + (50*0.05)
        currentStock: 6.8,
        unit: 'kg',
        shortageQty: 0,
        unitCost: 8.5,
        shortageCost: 0,
        supplierId: 's3',
        supplierName: 'Alpine Dairy Co.',
      },
      {
        itemId: 'i8',
        itemName: 'Romaine Lettuce',
        requiredQty: 9.2, // (80*0.04) + (50*0.12)
        currentStock: 3.1,
        unit: 'kg',
        shortageQty: 6.1, // Shortage!
        unitCost: 2.2,
        shortageCost: 13.42,
        supplierId: 's2',
        supplierName: 'FreshProduce GmbH',
      },
    ],
    hasShortage: true,
    shortageCount: 2,
    totalShortageCost: 25.82,
    createdAt: '09 Mar 2026',
    updatedAt: '10 Mar 2026',
  },
  {
    id: 'ev-3',
    title: 'Rotary Club Luncheon',
    date: '10 Mar 2026',
    time: '12:30',
    status: 'completed',
    guestCount: 30,
    location: 'Conservatory Room',
    contactPerson: 'Gerhard Becker',
    notes: 'Event successfully concluded. POS sales reconciliation verified.',
    menuItems: [
      {
        recipeId: 'r1',
        recipeName: 'Menu 1 — Chicken Plate',
        category: 'Main Course',
        portionCount: 30,
        costPerServing: 3.42,
      },
    ],
    totalEstimatedCost: 102.6,
    ingredientRequirements: [
      {
        itemId: 'i1',
        itemName: 'Chicken Breast',
        requiredQty: 6.0,
        currentStock: 24.5,
        unit: 'kg',
        shortageQty: 0,
        unitCost: 4.8,
        shortageCost: 0,
      },
    ],
    hasShortage: false,
    shortageCount: 0,
    totalShortageCost: 0,
    createdAt: '01 Mar 2026',
    updatedAt: '10 Mar 2026',
  },
];

let localEvents = [...INITIAL_EVENTS];

export interface IEventService {
  getEvents(filters?: { status?: EventStatus; search?: string }): Promise<CateringEvent[]>;
  getEventById(id: string): Promise<CateringEvent | null>;
  createEvent(payload: Partial<CateringEvent>): Promise<CateringEvent>;
  calculateEventRequirements(menuItems: EventMenuItem[]): Promise<{
    requirements: EventIngredientRequirement[];
    totalEstimatedCost: number;
    hasShortage: boolean;
    shortageCount: number;
    totalShortageCost: number;
  }>;
}

export class RealEventService implements IEventService {
  async getEvents(filters?: { status?: EventStatus; search?: string }): Promise<CateringEvent[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const res = await apiClient.get<any>(`/events${qs}`);
      const list = Array.isArray(res) ? res : res?.items || res?.data;
      if (Array.isArray(list)) return list;
      return apiClient.isFallbackEnabled() ? this.filterLocal(filters) : [];
    } catch (err) {
      logDebugFallback('EventService', '/events [GET]', err);
      return apiClient.isFallbackEnabled() ? this.filterLocal(filters) : [];
    }
  }

  private filterLocal(filters?: { status?: EventStatus; search?: string }): CateringEvent[] {
    let result = [...localEvents];
    if (filters?.status) {
      result = result.filter((e) => e.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.contactPerson.toLowerCase().includes(q)
      );
    }
    return result;
  }

  async getEventById(id: string): Promise<CateringEvent | null> {
    try {
      const res = await apiClient.get<CateringEvent>(`/events/${id}`);
      return res || localEvents.find((e) => e.id === id) || null;
    } catch (err) {
      logDebugFallback('EventService', `/events/${id}`, err);
      return localEvents.find((e) => e.id === id) || null;
    }
  }

  async calculateEventRequirements(menuItems: EventMenuItem[]): Promise<{
    requirements: EventIngredientRequirement[];
    totalEstimatedCost: number;
    hasShortage: boolean;
    shortageCount: number;
    totalShortageCost: number;
  }> {
    try {
      const [allRecipes, allInv] = await Promise.all([
        recipeService.getRecipes().catch(() => []),
        inventoryService.getItems().catch(() => []),
      ]);

      const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
      const invMap = new Map(allInv.map((i) => [i.id, i]));

      let totalEstimatedCost = 0;
      const ingredientAgg: Record<
        string,
        {
          itemId: string;
          itemName: string;
          requiredQty: number;
          unit: string;
          unitCost: number;
          supplierId?: string;
        }
      > = {};

      for (const menuItem of menuItems) {
        totalEstimatedCost += menuItem.costPerServing * menuItem.portionCount;
        const recipe = recipeMap.get(menuItem.recipeId);
        if (recipe && Array.isArray(recipe.ingredients)) {
          for (const ing of recipe.ingredients) {
            const rawNeeded = ing.quantity * menuItem.portionCount;
            if (!ingredientAgg[ing.itemId]) {
              const invItem = invMap.get(ing.itemId);
              ingredientAgg[ing.itemId] = {
                itemId: ing.itemId,
                itemName: ing.itemName || invItem?.name || 'Raw Ingredient',
                requiredQty: rawNeeded,
                unit: ing.unit || invItem?.unit || 'kg',
                unitCost: ing.costPerUnit || invItem?.costPerUnit || 1.0,
                supplierId: invItem?.supplierId,
              };
            } else {
              ingredientAgg[ing.itemId].requiredQty += rawNeeded;
            }
          }
        }
      }

      const requirements: EventIngredientRequirement[] = Object.values(ingredientAgg).map((agg) => {
        const inv = invMap.get(agg.itemId);
        const currentStock = inv?.physicalStock ?? 0;
        const shortageQty = Math.max(0, parseFloat((agg.requiredQty - currentStock).toFixed(2)));
        const shortageCost = parseFloat((shortageQty * agg.unitCost).toFixed(2));

        return {
          itemId: agg.itemId,
          itemName: agg.itemName,
          requiredQty: parseFloat(agg.requiredQty.toFixed(2)),
          currentStock,
          unit: agg.unit,
          shortageQty,
          unitCost: agg.unitCost,
          shortageCost,
          supplierId: agg.supplierId,
        };
      });

      const shortageCount = requirements.filter((r) => r.shortageQty > 0).length;
      const totalShortageCost = parseFloat(
        requirements.reduce((sum, r) => sum + r.shortageCost, 0).toFixed(2)
      );

      return {
        requirements,
        totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(2)),
        hasShortage: shortageCount > 0,
        shortageCount,
        totalShortageCost,
      };
    } catch {
      return {
        requirements: [],
        totalEstimatedCost: 0,
        hasShortage: false,
        shortageCount: 0,
        totalShortageCost: 0,
      };
    }
  }

  async createEvent(payload: Partial<CateringEvent>): Promise<CateringEvent> {
    const calc = await this.calculateEventRequirements(payload.menuItems || []);

    const newEv: CateringEvent = {
      id: `ev-${Date.now()}`,
      title: payload.title || 'Special Event Catering',
      date: payload.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: payload.time || '18:00',
      status: payload.status || 'upcoming',
      guestCount: payload.guestCount || 50,
      location: payload.location || 'Dining Hall',
      contactPerson: payload.contactPerson || 'Event Organizer',
      contactPhone: payload.contactPhone,
      notes: payload.notes,
      menuItems: payload.menuItems || [],
      totalEstimatedCost: calc.totalEstimatedCost,
      ingredientRequirements: calc.requirements,
      hasShortage: calc.hasShortage,
      shortageCount: calc.shortageCount,
      totalShortageCost: calc.totalShortageCost,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    localEvents.unshift(newEv);
    try {
      await apiClient.post('/events', newEv);
    } catch {
      // safe fallback
    }
    return newEv;
  }
}

export const eventService: IEventService = new RealEventService();
