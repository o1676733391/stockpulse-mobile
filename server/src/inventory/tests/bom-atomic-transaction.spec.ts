import { BadRequestException } from '@nestjs/common';
import {
  BomDeductionEngine,
  ComputedIngredientDeduction,
  IngredientInventoryState,
} from '../bom/bom-deduction.engine';

describe('BOM Deduction - Transaction Atomicity & Rollback Safety Tests', () => {
  let engine: BomDeductionEngine;
  let inventoryStore: Map<string, IngredientInventoryState>;
  let ledgerStore: any[];

  beforeEach(() => {
    engine = new BomDeductionEngine();
    inventoryStore = new Map();
    ledgerStore = [];

    // Initialize 3 raw ingredients in stock
    inventoryStore.set('ing-01', {
      id: 'ing-01',
      sku: 'RAW-01',
      name: 'Ingredient Alpha',
      unit: 'kg',
      physicalStock: 10.0,
      theoreticalStock: 10.0,
      costPerUnit: 5.0,
    });

    inventoryStore.set('ing-02', {
      id: 'ing-02',
      sku: 'RAW-02',
      name: 'Ingredient Beta',
      unit: 'L',
      physicalStock: 25.0,
      theoreticalStock: 25.0,
      costPerUnit: 2.0,
    });

    inventoryStore.set('ing-03', {
      id: 'ing-03',
      sku: 'RAW-03',
      name: 'Ingredient Gamma',
      unit: 'pcs',
      physicalStock: 50.0,
      theoreticalStock: 50.0,
      costPerUnit: 1.0,
    });
  });

  it('1. Atomic Success: Should deduct all ingredients and commit ledger entries atomically', async () => {
    const deductions: ComputedIngredientDeduction[] = [
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-01',
        ingredientName: 'Ingredient Alpha',
        quantityDeducted: 2.0,
        unit: 'kg',
        unitCost: 5.0,
        totalCost: 10.0,
        previousPhysicalStock: 10.0,
        newPhysicalStock: 8.0,
        previousTheoreticalStock: 10.0,
        newTheoreticalStock: 8.0,
        isInsufficientStock: false,
      },
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-02',
        ingredientName: 'Ingredient Beta',
        quantityDeducted: 5.0,
        unit: 'L',
        unitCost: 2.0,
        totalCost: 10.0,
        previousPhysicalStock: 25.0,
        newPhysicalStock: 20.0,
        previousTheoreticalStock: 25.0,
        newTheoreticalStock: 20.0,
        isInsufficientStock: false,
      },
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-03',
        ingredientName: 'Ingredient Gamma',
        quantityDeducted: 10.0,
        unit: 'pcs',
        unitCost: 1.0,
        totalCost: 10.0,
        previousPhysicalStock: 50.0,
        newPhysicalStock: 40.0,
        previousTheoreticalStock: 50.0,
        newTheoreticalStock: 40.0,
        isInsufficientStock: false,
      },
    ];

    const result = await engine.executeAtomicDeduction(
      'store-01',
      'doc-01',
      'user-01',
      deductions,
      inventoryStore,
      ledgerStore,
    );

    expect(result.success).toBe(true);
    expect(result.appliedDeductionsCount).toBe(3);

    // Verify final physical stocks
    expect(inventoryStore.get('ing-01')!.physicalStock).toBe(8.0);
    expect(inventoryStore.get('ing-02')!.physicalStock).toBe(20.0);
    expect(inventoryStore.get('ing-03')!.physicalStock).toBe(40.0);

    // Verify ledger records
    expect(ledgerStore).toHaveLength(3);
    expect(ledgerStore[0].delta).toBe(-2.0);
    expect(ledgerStore[1].delta).toBe(-5.0);
    expect(ledgerStore[2].delta).toBe(-10.0);
  });

  it('2. CRITICAL TRANSACTION ROLLBACK: Failure on step 3 must rollback prior deductions (NO PARTIAL DEDUCTION)', async () => {
    const deductions: ComputedIngredientDeduction[] = [
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-01',
        ingredientName: 'Ingredient Alpha',
        quantityDeducted: 2.0, // Step 0
        unit: 'kg',
        unitCost: 5.0,
        totalCost: 10.0,
        previousPhysicalStock: 10.0,
        newPhysicalStock: 8.0,
        previousTheoreticalStock: 10.0,
        newTheoreticalStock: 8.0,
        isInsufficientStock: false,
      },
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-02',
        ingredientName: 'Ingredient Beta',
        quantityDeducted: 5.0, // Step 1
        unit: 'L',
        unitCost: 2.0,
        totalCost: 10.0,
        previousPhysicalStock: 25.0,
        newPhysicalStock: 20.0,
        previousTheoreticalStock: 25.0,
        newTheoreticalStock: 20.0,
        isInsufficientStock: false,
      },
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-03',
        ingredientName: 'Ingredient Gamma',
        quantityDeducted: 10.0, // Step 2 (FAILS HERE)
        unit: 'pcs',
        unitCost: 1.0,
        totalCost: 10.0,
        previousPhysicalStock: 50.0,
        newPhysicalStock: 40.0,
        previousTheoreticalStock: 50.0,
        newTheoreticalStock: 40.0,
        isInsufficientStock: false,
      },
    ];

    // Simulate database write failure on step index 2 (Ingredient Gamma)
    await expect(
      engine.executeAtomicDeduction(
        'store-01',
        'doc-01',
        'user-01',
        deductions,
        inventoryStore,
        ledgerStore,
        2, // simulate failure on index 2
      ),
    ).rejects.toThrow('Simulated database failure during deduction step index 2');

    // CRITICAL ATOMICITY VERIFICATION:
    // None of the inventory items may remain deducted! All stock must be exactly restored to initial values!
    expect(inventoryStore.get('ing-01')!.physicalStock).toBe(10.0); // NOT 8.0
    expect(inventoryStore.get('ing-01')!.theoreticalStock).toBe(10.0);
    expect(inventoryStore.get('ing-02')!.physicalStock).toBe(25.0); // NOT 20.0
    expect(inventoryStore.get('ing-02')!.theoreticalStock).toBe(25.0);
    expect(inventoryStore.get('ing-03')!.physicalStock).toBe(50.0);
    expect(inventoryStore.get('ing-03')!.theoreticalStock).toBe(50.0);

    // Ledger store must have 0 committed entries
    expect(ledgerStore).toHaveLength(0);
  });

  it('3. Unknown Ingredient: Must abort transaction and leave other items unchanged', async () => {
    const deductions: ComputedIngredientDeduction[] = [
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-01',
        ingredientName: 'Ingredient Alpha',
        quantityDeducted: 2.0,
        unit: 'kg',
        unitCost: 5.0,
        totalCost: 10.0,
        previousPhysicalStock: 10.0,
        newPhysicalStock: 8.0,
        previousTheoreticalStock: 10.0,
        newTheoreticalStock: 8.0,
        isInsufficientStock: false,
      },
      {
        recipeId: 'rec-01',
        recipeName: 'Combo Dish',
        ingredientId: 'ing-ghost-unregistered',
        ingredientName: 'Ghost Ingredient',
        quantityDeducted: 1.0,
        unit: 'kg',
        unitCost: 10.0,
        totalCost: 10.0,
        previousPhysicalStock: 0,
        newPhysicalStock: 0,
        previousTheoreticalStock: 0,
        newTheoreticalStock: 0,
        isInsufficientStock: true,
      },
    ];

    await expect(
      engine.executeAtomicDeduction(
        'store-01',
        'doc-01',
        'user-01',
        deductions,
        inventoryStore,
        ledgerStore,
      ),
    ).rejects.toThrow(BadRequestException);

    // Verify Alpha was not deducted
    expect(inventoryStore.get('ing-01')!.physicalStock).toBe(10.0);
    expect(ledgerStore).toHaveLength(0);
  });
});
