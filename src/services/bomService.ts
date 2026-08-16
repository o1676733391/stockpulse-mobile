import { InventoryItem } from '@/types/inventory';
import { BomDeductionResult, BomIngredientDeduction, OcrItem, Recipe } from '@/types/ocr';

/**
 * Calculates raw ingredient deductions from confirmed OCR menu items using Recipe Bill of Materials (BOM).
 */
export function calculateBomDeductions(
  ocrItems: OcrItem[],
  recipes: Recipe[],
  inventory: InventoryItem[],
  reportMeta?: { reportNumber?: string; date?: string; shift?: string }
): BomDeductionResult {
  const itemDeductionMap: Record<string, { delta: number; itemName: string; unit: string; costPerUnit: number; currentStock: number }> = {};

  let totalPortions = 0;

  for (const ocrItem of ocrItems) {
    if (ocrItem.qty <= 0) continue;
    totalPortions += ocrItem.qty;

    // Find mapped recipe
    const recipe = recipes.find(
      (r) => r.id === ocrItem.recipeId || r.name.toLowerCase() === ocrItem.item.toLowerCase()
    );

    if (!recipe) continue;

    for (const ing of recipe.ingredients) {
      const invItem = inventory.find((i) => i.id === ing.itemId);
      const costPerUnit = invItem ? invItem.costPerUnit : 0;
      const currentStock = invItem ? invItem.theoreticalStock : 0;
      const deductionAmount = ing.quantity * ocrItem.qty;

      if (!itemDeductionMap[ing.itemId]) {
        itemDeductionMap[ing.itemId] = {
          delta: 0,
          itemName: ing.itemName,
          unit: ing.unit,
          costPerUnit,
          currentStock,
        };
      }

      itemDeductionMap[ing.itemId].delta += deductionAmount;
    }
  }

  const deductions: BomIngredientDeduction[] = Object.entries(itemDeductionMap).map(
    ([itemId, data]) => {
      const deltaRounded = Math.round(data.delta * 100) / 100;
      const costEur = Math.round(deltaRounded * data.costPerUnit * 100) / 100;
      const theoreticalBefore = data.currentStock;
      const theoreticalAfter = Math.max(0, Math.round((theoreticalBefore - deltaRounded) * 100) / 100);

      return {
        itemId,
        itemName: data.itemName,
        delta: -deltaRounded,
        unit: data.unit,
        costEur,
        theoreticalBefore,
        theoreticalAfter,
      };
    }
  );

  // Sort by highest financial impact
  deductions.sort((a, b) => b.costEur - a.costEur);

  return {
    reportId: `rep-${Date.now()}`,
    reportNumber: reportMeta?.reportNumber || '2048',
    date: reportMeta?.date || '10 Mar 2026',
    shift: reportMeta?.shift || 'Lunch shift',
    totalPortions,
    menuItemCount: ocrItems.filter((i) => i.qty > 0).length,
    deductions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Applies theoretical stock reductions to inventory items without altering physical stock.
 */
export function applyTheoreticalDeductions(
  deductions: BomIngredientDeduction[],
  inventory: InventoryItem[]
): InventoryItem[] {
  return inventory.map((item) => {
    const deduction = deductions.find((d) => d.itemId === item.id);
    if (!deduction) return item;

    const newTheoretical = Math.max(
      0,
      Math.round((item.theoreticalStock + deduction.delta) * 100) / 100
    );

    const newTransaction = {
      id: `tx-bom-${Date.now()}-${item.id}`,
      type: 'pos_deduction' as const,
      date: 'Today, 10 Mar',
      user: 'POS OCR Auto-Deduction',
      delta: deduction.delta,
      note: 'POS Report #2048 BOM Deduction',
    };

    return {
      ...item,
      theoreticalStock: newTheoretical,
      transactions: [newTransaction, ...item.transactions],
    };
  });
}
