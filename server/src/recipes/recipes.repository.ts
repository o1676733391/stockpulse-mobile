import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateRecipeDto,
  DeductRecipeDto,
  QueryRecipesDto,
  RecipeDeductionDetailDto,
  RecipeDeductionResponseDto,
  RecipeIngredientResponseDto,
  RecipeResponseDto,
  UpdateRecipeDto,
} from './dto/recipe.dto';
import { IRecipesRepository } from './interfaces/recipes.repository.interface';

@Injectable()
export class RecipesRepository implements IRecipesRepository {
  private readonly logger = new Logger(RecipesRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private mapRecipeRowToDto(recipe: any): RecipeResponseDto {
    const ingredients: RecipeIngredientResponseDto[] = [];
    let totalCost = 0;

    if (recipe.recipe_ingredients && Array.isArray(recipe.recipe_ingredients)) {
      for (const ing of recipe.recipe_ingredients) {
        const item = ing.inventory_items || {};
        const costPerUnit = Number(item.cost_per_unit || 0);
        const quantity = Number(ing.quantity || 0);
        const wastePercentage = Number(ing.waste_percentage || 0);
        const grossQty = quantity * (1 + wastePercentage / 100);
        const lineCost = Math.round(grossQty * costPerUnit * 10000) / 10000;
        totalCost += lineCost;

        const availableStock = item.physical_stock !== undefined ? Number(item.physical_stock) : undefined;

        ingredients.push({
          id: ing.id,
          recipeId: ing.recipe_id,
          itemId: ing.item_id,
          itemName: item.name || 'Unknown Item',
          itemSku: item.sku || 'N/A',
          quantity,
          unit: ing.unit,
          wastePercentage,
          costPerUnit,
          lineCost,
          availableStock,
        });
      }
    }

    const portionYield = Number(recipe.portion_yield || 1);
    const costPerPortion = Math.round((totalCost / portionYield) * 100) / 100;

    return {
      id: recipe.id,
      storeId: recipe.store_id,
      code: recipe.code,
      name: recipe.name,
      category: recipe.category || 'General',
      portionYield,
      posItemName: recipe.pos_item_name || recipe.name,
      isActive: recipe.is_active !== false,
      costPerPortion,
      ingredients,
      createdAt: recipe.created_at || new Date().toISOString(),
      updatedAt: recipe.updated_at || new Date().toISOString(),
    };
  }

  async findPaginated(
    storeId: string,
    query?: QueryRecipesDto,
  ): Promise<RecipeResponseDto[]> {
    this.logger.log(`RecipesRepository.findPaginated: store=${storeId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    let sbQuery = client
      .from('recipes')
      .select(`
        id,
        store_id,
        code,
        name,
        category,
        portion_yield,
        pos_item_name,
        is_active,
        created_at,
        updated_at,
        recipe_ingredients (
          id,
          recipe_id,
          item_id,
          quantity,
          unit,
          waste_percentage,
          inventory_items (
            id,
            sku,
            name,
            cost_per_unit,
            physical_stock
          )
        )
      `)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (query?.category) {
      sbQuery = sbQuery.eq('category', query.category);
    }
    if (query?.isActive !== undefined) {
      sbQuery = sbQuery.eq('is_active', query.isActive);
    }
    if (query?.search) {
      sbQuery = sbQuery.or(
        `name.ilike.%${query.search}%,code.ilike.%${query.search}%,pos_item_name.ilike.%${query.search}%`,
      );
    }

    const { data, error } = await sbQuery;
    if (error) {
      this.logger.error(`Error fetching recipes: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    return (data || []).map((row) => this.mapRecipeRowToDto(row));
  }

  async findById(id: string, storeId: string): Promise<RecipeResponseDto | null> {
    this.logger.log(`RecipesRepository.findById: ${id} in store=${storeId}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const { data, error } = await client
      .from('recipes')
      .select(`
        id,
        store_id,
        code,
        name,
        category,
        portion_yield,
        pos_item_name,
        is_active,
        created_at,
        updated_at,
        recipe_ingredients (
          id,
          recipe_id,
          item_id,
          quantity,
          unit,
          waste_percentage,
          inventory_items (
            id,
            sku,
            name,
            cost_per_unit,
            physical_stock
          )
        )
      `)
      .eq('id', id)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRecipeRowToDto(data);
  }

  async findByCode(code: string, storeId: string): Promise<RecipeResponseDto | null> {
    const client = this.supabaseService.getAdminClient();
    if (!client) return null;

    const { data, error } = await client
      .from('recipes')
      .select('id')
      .eq('code', code)
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.findById(data.id, storeId);
  }

  async create(storeId: string, dto: CreateRecipeDto): Promise<RecipeResponseDto> {
    this.logger.log(`RecipesRepository.create: ${dto.code} - ${dto.name}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    // Check unique code
    const existing = await this.findByCode(dto.code, storeId);
    if (existing) {
      throw new ConflictException(`Recipe with code '${dto.code}' already exists`);
    }

    // Insert Recipe
    const { data: recipeData, error: recipeError } = await client
      .from('recipes')
      .insert({
        store_id: storeId,
        code: dto.code,
        name: dto.name,
        category: dto.category || 'General',
        portion_yield: dto.portionYield || 1.0,
        pos_item_name: dto.posItemName || dto.name,
        is_active: true,
      })
      .select()
      .single();

    if (recipeError || !recipeData) {
      this.logger.error(`Error inserting recipe: ${recipeError?.message}`);
      throw new InternalServerErrorException(recipeError?.message || 'Failed to create recipe');
    }

    // Insert Ingredients if provided
    if (dto.ingredients && dto.ingredients.length > 0) {
      const ingredientRows = dto.ingredients.map((ing) => ({
        recipe_id: recipeData.id,
        item_id: ing.itemId,
        quantity: ing.quantity,
        unit: ing.unit,
        waste_percentage: ing.wastePercentage || 0,
      }));

      const { error: ingError } = await client
        .from('recipe_ingredients')
        .insert(ingredientRows);

      if (ingError) {
        this.logger.error(`Error inserting recipe ingredients: ${ingError.message}`);
        // Clean up recipe on ingredient insert failure
        await client.from('recipes').delete().eq('id', recipeData.id);
        throw new InternalServerErrorException(`Failed to save recipe ingredients: ${ingError.message}`);
      }
    }

    const created = await this.findById(recipeData.id, storeId);
    if (!created) {
      throw new InternalServerErrorException('Failed to retrieve newly created recipe');
    }
    return created;
  }

  async update(
    id: string,
    storeId: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    this.logger.log(`RecipesRepository.update: ${id}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const existing = await this.findById(id, storeId);
    if (!existing) {
      throw new NotFoundException(`Recipe with ID '${id}' not found in store '${storeId}'`);
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.findByCode(dto.code, storeId);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Recipe with code '${dto.code}' already exists`);
      }
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (dto.code !== undefined) updatePayload.code = dto.code;
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.category !== undefined) updatePayload.category = dto.category;
    if (dto.portionYield !== undefined) updatePayload.portion_yield = dto.portionYield;
    if (dto.posItemName !== undefined) updatePayload.pos_item_name = dto.posItemName;
    if (dto.isActive !== undefined) updatePayload.is_active = dto.isActive;

    const { error: updateError } = await client
      .from('recipes')
      .update(updatePayload)
      .eq('id', id)
      .eq('store_id', storeId);

    if (updateError) {
      this.logger.error(`Error updating recipe: ${updateError.message}`);
      throw new InternalServerErrorException(updateError.message);
    }

    if (dto.ingredients !== undefined) {
      // Replace existing ingredients
      await client.from('recipe_ingredients').delete().eq('recipe_id', id);

      if (dto.ingredients.length > 0) {
        const ingredientRows = dto.ingredients.map((ing) => ({
          recipe_id: id,
          item_id: ing.itemId,
          quantity: ing.quantity,
          unit: ing.unit,
          waste_percentage: ing.wastePercentage || 0,
        }));

        const { error: ingError } = await client
          .from('recipe_ingredients')
          .insert(ingredientRows);

        if (ingError) {
          this.logger.error(`Error updating ingredients: ${ingError.message}`);
          throw new InternalServerErrorException(ingError.message);
        }
      }
    }

    const updated = await this.findById(id, storeId);
    if (!updated) {
      throw new InternalServerErrorException('Failed to retrieve updated recipe');
    }
    return updated;
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    this.logger.log(`RecipesRepository.delete (soft): ${id}`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const existing = await this.findById(id, storeId);
    if (!existing) {
      throw new NotFoundException(`Recipe with ID '${id}' not found`);
    }

    const { error } = await client
      .from('recipes')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)
      .eq('store_id', storeId);

    if (error) {
      this.logger.error(`Error deleting recipe: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }

    return true;
  }

  async deductRecipe(
    id: string,
    storeId: string,
    actorId: string,
    actorName: string,
    dto: DeductRecipeDto,
  ): Promise<RecipeDeductionResponseDto> {
    this.logger.log(`RecipesRepository.deductRecipe: ${id} x${dto.quantity} portions`);
    const client = this.supabaseService.getAdminClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client unavailable');
    }

    const recipe = await this.findById(id, storeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID '${id}' not found`);
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      throw new BadRequestException(`Recipe '${recipe.name}' has no ingredients configured for BOM deduction`);
    }

    const multiplier = Number(dto.quantity) / (Number(recipe.portionYield) || 1.0);
    const deductions: RecipeDeductionDetailDto[] = [];
    let totalCostImpact = 0;

    // Execute atomic sequential transaction across ingredients
    for (const ing of recipe.ingredients) {
      // Get current inventory item
      const { data: itemData, error: itemError } = await client
        .from('inventory_items')
        .select('id, name, physical_stock, theoretical_stock, cost_per_unit, unit')
        .eq('id', ing.itemId)
        .eq('store_id', storeId)
        .single();

      if (itemError || !itemData) {
        throw new NotFoundException(
          `Inventory ingredient '${ing.itemName}' (ID: ${ing.itemId}) not found in store '${storeId}'`,
        );
      }

      const wasteMultiplier = 1 + (Number(ing.wastePercentage || 0) / 100);
      const grossQuantityNeeded =
        Math.round(Number(ing.quantity) * multiplier * wasteMultiplier * 10000) / 10000;

      const previousStock = Number(itemData.physical_stock ?? itemData.theoretical_stock ?? 0);
      const previousTheoretical = Number(itemData.theoretical_stock ?? itemData.physical_stock ?? 0);
      const newStock = Math.round((previousStock - grossQuantityNeeded) * 10000) / 10000;
      const newTheoretical = Math.round((previousTheoretical - grossQuantityNeeded) * 10000) / 10000;
      const unitCost = Number(itemData.cost_per_unit || 0);
      const lineCost = Math.round(grossQuantityNeeded * unitCost * 100) / 100;
      totalCostImpact += lineCost;

      // Update Inventory Item Stock
      const { error: stockUpdateError } = await client
        .from('inventory_items')
        .update({
          physical_stock: newStock,
          theoretical_stock: newTheoretical,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ing.itemId)
        .eq('store_id', storeId);

      if (stockUpdateError) {
        this.logger.error(`Stock update failed for ${ing.itemId}: ${stockUpdateError.message}`);
        throw new InternalServerErrorException(`Failed to deduct stock for ${ing.itemName}`);
      }

      // Record Transaction Ledger Entry
      await client.from('inventory_transactions').insert({
        store_id: storeId,
        item_id: ing.itemId,
        transaction_type: 'pos_deduction',
        quantity: -grossQuantityNeeded,
        previous_stock: previousStock,
        new_stock: newStock,
        cost_impact: -lineCost,
        actor_id: actorId,
        actor_name: actorName || 'System',
        reference_type: dto.referenceType || 'recipe',
        reference_id: dto.referenceId || recipe.id,
        note: dto.note || `Recipe deduction: ${recipe.name} x${dto.quantity}`,
      });

      deductions.push({
        itemId: ing.itemId,
        itemName: itemData.name,
        quantityDeducted: grossQuantityNeeded,
        unit: ing.unit,
        unitCost,
        totalCost: lineCost,
        previousStock,
        newStock,
      });
    }

    return {
      success: true,
      recipeId: recipe.id,
      recipeName: recipe.name,
      portionsDeducted: dto.quantity,
      totalCostImpact: Math.round(totalCostImpact * 100) / 100,
      deductions,
    };
  }
}
