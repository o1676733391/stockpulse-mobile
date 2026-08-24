import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UnitOfMeasure } from '../entities/inventory-item.entity';

export interface BomSalesItem {
  ocrItemId?: string;
  posItemId?: string;
  name: string;
  quantity: number;
  matchedRecipeId?: string | null;
}

export interface BomIngredientDefinition {
  ingredientId: string;
  ingredientName: string;
  unit: UnitOfMeasure;
  quantityPerPortion: number;
  wastePercentage?: number;
  unitCost: number;
}

export interface BomRecipeDefinition {
  recipeId: string;
  recipeName: string;
  portionYield?: number;
  ingredients: BomIngredientDefinition[];
}

export interface IngredientInventoryState {
  id: string;
  name: string;
  sku: string;
  unit: UnitOfMeasure;
  physicalStock: number;
  theoreticalStock: number;
  costPerUnit: number;
}

export interface ComputedIngredientDeduction {
  ocrItemId?: string;
  recipeId: string;
  recipeName: string;
  ingredientId: string;
  ingredientName: string;
  quantityDeducted: number;
  unit: UnitOfMeasure;
  unitCost: number;
  totalCost: number;
  previousPhysicalStock: number;
  newPhysicalStock: number;
  previousTheoreticalStock: number;
  newTheoreticalStock: number;
  isInsufficientStock: boolean;
}

export interface BomCalculationResult {
  totalDeductionsCount: number;
  totalCostImpact: number;
  unmappedItemsCount: number;
  deductions: ComputedIngredientDeduction[];
  hasInsufficientStockWarnings: boolean;
  warnings: string[];
}

@Injectable()
export class BomDeductionEngine {
  private readonly logger = new Logger(BomDeductionEngine.name);

  /**
   * Calculate exact BOM raw ingredient deductions from sales lines and recipe definitions.
   * Handles fractional quantities, waste percentages, multi-ingredient aggregation, and insufficient stock flags.
   */
  calculateDeductions(
    salesItems: BomSalesItem[],
    recipeMap: Map<string, BomRecipeDefinition>,
    inventoryMap: Map<string, IngredientInventoryState>,
  ): BomCalculationResult {
    const deductions: ComputedIngredientDeduction[] = [];
    const warnings: string[] = [];
    let unmappedItemsCount = 0;
    let totalCostImpact = 0;
    let hasInsufficientStockWarnings = false;

    // Aggregation tracker to compute cumulative deductions per ingredient
    const cumulativeDeductionByIngredient = new Map<string, number>();

    for (const salesItem of salesItems) {
      if (!salesItem.matchedRecipeId) {
        unmappedItemsCount++;
        warnings.push(`Item '${salesItem.name}' has no matched recipe (BOM skipped)`);
        continue;
      }

      const recipe = recipeMap.get(salesItem.matchedRecipeId);
      if (!recipe) {
        unmappedItemsCount++;
        warnings.push(`Recipe '${salesItem.matchedRecipeId}' not found in catalog (BOM skipped)`);
        continue;
      }

      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        warnings.push(`Recipe '${recipe.recipeName}' has no defined ingredients (0 deductions)`);
        continue;
      }

      for (const ing of recipe.ingredients) {
        if (!ing.quantityPerPortion || ing.quantityPerPortion <= 0) {
          continue; // Incomplete ingredient entry with 0 quantity skipped safely
        }

        const wasteMultiplier = 1 + (Number(ing.wastePercentage || 0) / 100);
        const grossQuantityNeeded =
          Math.round(salesItem.quantity * ing.quantityPerPortion * wasteMultiplier * 10000) / 10000;

        const currentCumulative = cumulativeDeductionByIngredient.get(ing.ingredientId) || 0;
        const newCumulative = Math.round((currentCumulative + grossQuantityNeeded) * 10000) / 10000;
        cumulativeDeductionByIngredient.set(ing.ingredientId, newCumulative);

        const currentStockItem = inventoryMap.get(ing.ingredientId);
        const physicalStock = currentStockItem ? Number(currentStockItem.physicalStock) : 0;
        const theoreticalStock = currentStockItem ? Number(currentStockItem.theoreticalStock) : 0;
        const unitCost = Number(ing.unitCost || currentStockItem?.costPerUnit || 0);

        const totalCost = Math.round(grossQuantityNeeded * unitCost * 100) / 100;
        totalCostImpact = Math.round((totalCostImpact + totalCost) * 100) / 100;

        const remainingPhysical = Math.round((physicalStock - newCumulative) * 10000) / 10000;
        const remainingTheoretical = Math.round((theoreticalStock - newCumulative) * 10000) / 10000;

        const isInsufficient = remainingPhysical < 0;
        if (isInsufficient) {
          hasInsufficientStockWarnings = true;
          warnings.push(
            `Insufficient stock for '${ing.ingredientName}': Required cumulative ${newCumulative} ${ing.unit}, Available ${physicalStock} ${ing.unit}`,
          );
        }

        deductions.push({
          ocrItemId: salesItem.ocrItemId,
          recipeId: recipe.recipeId,
          recipeName: recipe.recipeName,
          ingredientId: ing.ingredientId,
          ingredientName: ing.ingredientName,
          quantityDeducted: grossQuantityNeeded,
          unit: ing.unit,
          unitCost,
          totalCost,
          previousPhysicalStock: physicalStock,
          newPhysicalStock: remainingPhysical,
          previousTheoreticalStock: theoreticalStock,
          newTheoreticalStock: remainingTheoretical,
          isInsufficientStock: isInsufficient,
        });
      }
    }

    return {
      totalDeductionsCount: deductions.length,
      totalCostImpact,
      unmappedItemsCount,
      deductions,
      hasInsufficientStockWarnings,
      warnings,
    };
  }

  /**
   * Execute atomic transaction deduction on inventory state.
   * If any step fails or database error occurs, rollback simulation ensures ZERO partial state mutation.
   */
  async executeAtomicDeduction(
    storeId: string,
    documentId: string,
    actorId: string,
    deductions: ComputedIngredientDeduction[],
    inventoryStore: Map<string, IngredientInventoryState>,
    ledgerStore: any[],
    simulateDatabaseFailureOnStep?: number,
  ): Promise<{ success: boolean; appliedDeductionsCount: number }> {
    if (!deductions || deductions.length === 0) {
      return { success: true, appliedDeductionsCount: 0 };
    }

    // Create transactional snapshot for rollback
    const inventorySnapshot = new Map<string, IngredientInventoryState>();
    for (const [id, item] of inventoryStore.entries()) {
      inventorySnapshot.set(id, { ...item });
    }
    const initialLedgerLength = ledgerStore.length;

    const appliedEntries: any[] = [];

    try {
      for (let i = 0; i < deductions.length; i++) {
        if (simulateDatabaseFailureOnStep !== undefined && i === simulateDatabaseFailureOnStep) {
          throw new Error(`Simulated database failure during deduction step index ${i}`);
        }

        const d = deductions[i];
        const stockItem = inventoryStore.get(d.ingredientId);
        if (!stockItem) {
          throw new BadRequestException(`Inventory item '${d.ingredientId}' not found in store '${storeId}'`);
        }

        // Apply deduction to in-memory transaction state
        stockItem.physicalStock = Math.round((stockItem.physicalStock - d.quantityDeducted) * 10000) / 10000;
        stockItem.theoreticalStock = Math.round((stockItem.theoreticalStock - d.quantityDeducted) * 10000) / 10000;

        const ledgerTx = {
          storeId,
          itemId: d.ingredientId,
          transactionType: 'BOM_DEDUCTION',
          delta: -d.quantityDeducted,
          previousStock: d.previousPhysicalStock,
          newStock: stockItem.physicalStock,
          costImpact: -d.totalCost,
          actorId,
          referenceId: documentId,
          timestamp: new Date().toISOString(),
        };

        appliedEntries.push(ledgerTx);
      }

      // Commit to ledger
      ledgerStore.push(...appliedEntries);

      return {
        success: true,
        appliedDeductionsCount: deductions.length,
      };
    } catch (error) {
      this.logger.error(`BOM atomic transaction aborted: ${(error as Error).message}. Rolling back state.`);

      // Rollback inventory to snapshot
      inventoryStore.clear();
      for (const [id, item] of inventorySnapshot.entries()) {
        inventoryStore.set(id, item);
      }

      // Rollback ledger
      ledgerStore.length = initialLedgerLength;

      throw error;
    }
  }
}
