import {
  BomDeductionEngine,
  BomRecipeDefinition,
  BomSalesItem,
  IngredientInventoryState,
} from '../bom/bom-deduction.engine';

describe('BOM Deduction - Mathematical Calculation & Recipe Mapping Tests', () => {
  let engine: BomDeductionEngine;
  let recipeMap: Map<string, BomRecipeDefinition>;
  let inventoryMap: Map<string, IngredientInventoryState>;

  beforeEach(() => {
    engine = new BomDeductionEngine();
    recipeMap = new Map();
    inventoryMap = new Map();

    // Setup Mock Ingredients
    inventoryMap.set('ing-beans-01', {
      id: 'ing-beans-01',
      sku: 'RAW-COF-01',
      name: 'Arabica Coffee Beans',
      unit: 'kg',
      physicalStock: 5.0,
      theoreticalStock: 5.0,
      costPerUnit: 24.0, // $24 / kg
    });

    inventoryMap.set('ing-milk-01', {
      id: 'ing-milk-01',
      sku: 'RAW-DAI-01',
      name: 'Fresh Whole Milk',
      unit: 'L',
      physicalStock: 20.0,
      theoreticalStock: 20.0,
      costPerUnit: 1.5, // $1.50 / L
    });

    inventoryMap.set('ing-dough-01', {
      id: 'ing-dough-01',
      sku: 'RAW-BAK-01',
      name: 'Pizza Dough Ball 250g',
      unit: 'pcs',
      physicalStock: 50.0,
      theoreticalStock: 50.0,
      costPerUnit: 0.75,
    });

    inventoryMap.set('ing-mozz-01', {
      id: 'ing-mozz-01',
      sku: 'RAW-DAI-02',
      name: 'Shredded Mozzarella Cheese',
      unit: 'kg',
      physicalStock: 10.0,
      theoreticalStock: 10.0,
      costPerUnit: 8.5,
    });

    inventoryMap.set('ing-sauce-01', {
      id: 'ing-sauce-01',
      sku: 'RAW-SAU-01',
      name: 'San Marzano Tomato Sauce',
      unit: 'kg',
      physicalStock: 8.0,
      theoreticalStock: 8.0,
      costPerUnit: 3.2,
    });

    // Setup Mock Recipes
    recipeMap.set('rec-espresso-01', {
      recipeId: 'rec-espresso-01',
      recipeName: 'Espresso Single Shot',
      ingredients: [
        {
          ingredientId: 'ing-beans-01',
          ingredientName: 'Arabica Coffee Beans',
          unit: 'kg',
          quantityPerPortion: 0.009, // 9g
          wastePercentage: 5, // 5% grind waste -> 0.00945 kg
          unitCost: 24.0,
        },
      ],
    });

    recipeMap.set('rec-cappuccino-01', {
      recipeId: 'rec-cappuccino-01',
      recipeName: 'Cappuccino 8oz',
      ingredients: [
        {
          ingredientId: 'ing-beans-01',
          ingredientName: 'Arabica Coffee Beans',
          unit: 'kg',
          quantityPerPortion: 0.018, // 18g double shot
          wastePercentage: 5, // -> 0.0189 kg
          unitCost: 24.0,
        },
        {
          ingredientId: 'ing-milk-01',
          ingredientName: 'Fresh Whole Milk',
          unit: 'L',
          quantityPerPortion: 0.18, // 180ml
          wastePercentage: 10, // 10% steam pitcher waste -> 0.198 L
          unitCost: 1.5,
        },
      ],
    });

    recipeMap.set('rec-pizza-margherita', {
      recipeId: 'rec-pizza-margherita',
      recipeName: 'Pizza Margherita 12"',
      ingredients: [
        {
          ingredientId: 'ing-dough-01',
          ingredientName: 'Pizza Dough Ball 250g',
          unit: 'pcs',
          quantityPerPortion: 1,
          wastePercentage: 0,
          unitCost: 0.75,
        },
        {
          ingredientId: 'ing-sauce-01',
          ingredientName: 'San Marzano Tomato Sauce',
          unit: 'kg',
          quantityPerPortion: 0.08,
          wastePercentage: 5,
          unitCost: 3.2,
        },
        {
          ingredientId: 'ing-mozz-01',
          ingredientName: 'Shredded Mozzarella Cheese',
          unit: 'kg',
          quantityPerPortion: 0.12,
          wastePercentage: 3,
          unitCost: 8.5,
        },
      ],
    });
  });

  it('1. Valid BOM: Should calculate deductions accurately for single recipe', () => {
    const sales: BomSalesItem[] = [
      { name: 'Espresso', quantity: 10, matchedRecipeId: 'rec-espresso-01' },
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);

    expect(result.totalDeductionsCount).toBe(1);
    expect(result.unmappedItemsCount).toBe(0);
    expect(result.hasInsufficientStockWarnings).toBe(false);

    const deduction = result.deductions[0];
    // 10 * 0.009 * 1.05 = 0.0945 kg
    expect(deduction.quantityDeducted).toBe(0.0945);
    expect(deduction.totalCost).toBe(2.27); // 0.0945 * 24.0 = 2.268 -> 2.27
    expect(deduction.newPhysicalStock).toBe(4.9055); // 5.0 - 0.0945
  });

  it('2. Missing BOM: Should skip unmapped sales items without crashing', () => {
    const sales: BomSalesItem[] = [
      { name: 'Retail Coffee Mug (Non-BOM)', quantity: 2, matchedRecipeId: null },
      { name: 'Unknown Promo Item', quantity: 1, matchedRecipeId: 'rec-non-existent' },
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);

    expect(result.totalDeductionsCount).toBe(0);
    expect(result.unmappedItemsCount).toBe(2);
    expect(result.warnings).toHaveLength(2);
  });

  it('3. Incomplete BOM: Should safely skip 0-quantity ingredients in recipe', () => {
    recipeMap.set('rec-incomplete', {
      recipeId: 'rec-incomplete',
      recipeName: 'Draft Recipe',
      ingredients: [
        {
          ingredientId: 'ing-beans-01',
          ingredientName: 'Coffee Beans',
          unit: 'kg',
          quantityPerPortion: 0.01,
          unitCost: 24.0,
        },
        {
          ingredientId: 'ing-milk-01',
          ingredientName: 'Milk',
          unit: 'L',
          quantityPerPortion: 0, // 0 quantity incomplete definition
          unitCost: 1.5,
        },
      ],
    });

    const sales: BomSalesItem[] = [
      { name: 'Draft Item', quantity: 5, matchedRecipeId: 'rec-incomplete' },
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);

    expect(result.totalDeductionsCount).toBe(1); // Only coffee beans deducted
    expect(result.deductions[0].ingredientId).toBe('ing-beans-01');
    expect(result.deductions[0].quantityDeducted).toBe(0.05);
  });

  it('4. Multiple Ingredients: Should aggregate deductions across multi-ingredient pizza recipes', () => {
    const sales: BomSalesItem[] = [
      { name: 'Pizza Margherita', quantity: 15, matchedRecipeId: 'rec-pizza-margherita' },
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);

    expect(result.totalDeductionsCount).toBe(3);

    const dough = result.deductions.find((d) => d.ingredientId === 'ing-dough-01')!;
    const sauce = result.deductions.find((d) => d.ingredientId === 'ing-sauce-01')!;
    const mozz = result.deductions.find((d) => d.ingredientId === 'ing-mozz-01')!;

    expect(dough.quantityDeducted).toBe(15); // 15 pcs
    expect(dough.newPhysicalStock).toBe(35.0); // 50 - 15

    // 15 * 0.08 * 1.05 = 1.26 kg
    expect(sauce.quantityDeducted).toBe(1.26);
    expect(sauce.newPhysicalStock).toBe(6.74); // 8 - 1.26

    // 15 * 0.12 * 1.03 = 1.854 kg
    expect(mozz.quantityDeducted).toBe(1.854);
    expect(mozz.newPhysicalStock).toBe(8.146); // 10 - 1.854
  });

  it('5. Fractional Quantities & Multiple Menu Items: Should accurately aggregate shared ingredient (coffee beans)', () => {
    const sales: BomSalesItem[] = [
      { name: 'Espresso Single', quantity: 20, matchedRecipeId: 'rec-espresso-01' },
      { name: 'Cappuccino', quantity: 15, matchedRecipeId: 'rec-cappuccino-01' },
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);

    // Espresso: 20 * 0.009 * 1.05 = 0.189 kg beans
    // Cappuccino: 15 * 0.018 * 1.05 = 0.2835 kg beans + 15 * 0.18 * 1.10 = 2.97 L milk
    // Total beans deducted = 0.189 + 0.2835 = 0.4725 kg
    const milk = result.deductions.find((d) => d.ingredientId === 'ing-milk-01')!;
    expect(milk.quantityDeducted).toBe(2.97);
    expect(milk.newPhysicalStock).toBe(17.03); // 20.0 - 2.97
  });

  it('6. Exact Stock: Should reduce stock exactly to 0 without precision error', () => {
    inventoryMap.set('ing-exact', {
      id: 'ing-exact',
      sku: 'RAW-EXACT',
      name: 'Exact Batch Flour',
      unit: 'kg',
      physicalStock: 2.5,
      theoreticalStock: 2.5,
      costPerUnit: 1.0,
    });

    recipeMap.set('rec-bread', {
      recipeId: 'rec-bread',
      recipeName: 'Artisan Bread',
      ingredients: [
        {
          ingredientId: 'ing-exact',
          ingredientName: 'Exact Batch Flour',
          unit: 'kg',
          quantityPerPortion: 0.5,
          unitCost: 1.0,
        },
      ],
    });

    const sales: BomSalesItem[] = [
      { name: 'Artisan Bread', quantity: 5, matchedRecipeId: 'rec-bread' },
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);
    const item = result.deductions[0];

    expect(item.quantityDeducted).toBe(2.5);
    expect(item.newPhysicalStock).toBe(0);
    expect(result.hasInsufficientStockWarnings).toBe(false);
  });

  it('7. Insufficient Stock: Should flag warning and calculate negative stock balance', () => {
    inventoryMap.set('ing-low', {
      id: 'ing-low',
      sku: 'RAW-LOW',
      name: 'Truffle Oil',
      unit: 'L',
      physicalStock: 0.2, // Only 0.2L available
      theoreticalStock: 0.2,
      costPerUnit: 80.0,
    });

    recipeMap.set('rec-truffle-fries', {
      recipeId: 'rec-truffle-fries',
      recipeName: 'Truffle Fries',
      ingredients: [
        {
          ingredientId: 'ing-low',
          ingredientName: 'Truffle Oil',
          unit: 'L',
          quantityPerPortion: 0.05, // 50ml
          unitCost: 80.0,
        },
      ],
    });

    const sales: BomSalesItem[] = [
      { name: 'Truffle Fries', quantity: 10, matchedRecipeId: 'rec-truffle-fries' }, // Needs 0.5L
    ];

    const result = engine.calculateDeductions(sales, recipeMap, inventoryMap);
    const item = result.deductions[0];

    expect(item.quantityDeducted).toBe(0.5);
    expect(item.newPhysicalStock).toBe(-0.3); // 0.2 - 0.5 = -0.3
    expect(item.isInsufficientStock).toBe(true);
    expect(result.hasInsufficientStockWarnings).toBe(true);
    expect(result.warnings[0]).toContain('Insufficient stock for \'Truffle Oil\'');
  });
});
