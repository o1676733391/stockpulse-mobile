import {
  CreateRecipeDto,
  DeductRecipeDto,
  QueryRecipesDto,
  RecipeDeductionResponseDto,
  RecipeResponseDto,
  UpdateRecipeDto,
} from '../dto/recipe.dto';

export interface IRecipesRepository {
  findPaginated(storeId: string, query?: QueryRecipesDto): Promise<RecipeResponseDto[]>;
  findById(id: string, storeId: string): Promise<RecipeResponseDto | null>;
  findByCode(code: string, storeId: string): Promise<RecipeResponseDto | null>;
  create(storeId: string, dto: CreateRecipeDto): Promise<RecipeResponseDto>;
  update(id: string, storeId: string, dto: UpdateRecipeDto): Promise<RecipeResponseDto>;
  delete(id: string, storeId: string): Promise<boolean>;
  deductRecipe(
    id: string,
    storeId: string,
    actorId: string,
    actorName: string,
    dto: DeductRecipeDto,
  ): Promise<RecipeDeductionResponseDto>;
}
