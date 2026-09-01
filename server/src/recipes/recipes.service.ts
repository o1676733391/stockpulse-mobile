import { Injectable, Logger } from '@nestjs/common';
import {
  CreateRecipeDto,
  DeductRecipeDto,
  QueryRecipesDto,
  RecipeDeductionResponseDto,
  RecipeResponseDto,
  UpdateRecipeDto,
} from './dto/recipe.dto';
import { RecipesRepository } from './recipes.repository';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(private readonly recipesRepository: RecipesRepository) {}

  async findPaginated(
    storeId: string,
    query?: QueryRecipesDto,
  ): Promise<RecipeResponseDto[]> {
    return this.recipesRepository.findPaginated(storeId, query);
  }

  async findById(id: string, storeId: string): Promise<RecipeResponseDto | null> {
    return this.recipesRepository.findById(id, storeId);
  }

  async create(storeId: string, dto: CreateRecipeDto): Promise<RecipeResponseDto> {
    return this.recipesRepository.create(storeId, dto);
  }

  async update(
    id: string,
    storeId: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesRepository.update(id, storeId, dto);
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    return this.recipesRepository.delete(id, storeId);
  }

  async deductRecipe(
    id: string,
    storeId: string,
    actorId: string,
    actorName: string,
    dto: DeductRecipeDto,
  ): Promise<RecipeDeductionResponseDto> {
    return this.recipesRepository.deductRecipe(
      id,
      storeId,
      actorId,
      actorName,
      dto,
    );
  }
}
