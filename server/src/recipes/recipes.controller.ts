import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateRecipeDto,
  DeductRecipeDto,
  QueryRecipesDto,
  RecipeDeductionResponseDto,
  RecipeResponseDto,
  UpdateRecipeDto,
} from './dto/recipe.dto';
import { RecipesService } from './recipes.service';

@ApiTags('Recipes')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({
    summary: 'List all recipes with BOM ingredients and portion cost calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'List of store recipes',
    type: [RecipeResponseDto],
  })
  async findAll(
    @CurrentStore() storeId: string,
    @Query() query: QueryRecipesDto,
  ): Promise<RecipeResponseDto[]> {
    return this.recipesService.findPaginated(
      storeId || '01915dfa-9012-7000-8000-000000000002',
      query,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get recipe details with full ingredient list and portion costs',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe details',
    type: RecipeResponseDto,
  })
  async findById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipesService.findById(
      id,
      storeId || '01915dfa-9012-7000-8000-000000000002',
    );
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID '${id}' not found`);
    }
    return recipe;
  }

  @Post()
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @ApiOperation({ summary: 'Create new recipe and configure BOM ingredients' })
  @ApiResponse({
    status: 201,
    description: 'Recipe successfully created',
    type: RecipeResponseDto,
  })
  async create(
    @CurrentStore() storeId: string,
    @Body() dto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.create(
      storeId || '01915dfa-9012-7000-8000-000000000002',
      dto,
    );
  }

  @Patch(':id')
  @Roles('admin', 'superadmin', 'manager', 'supervisor')
  @ApiOperation({ summary: 'Update recipe and reconfigure BOM ingredients' })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully updated',
    type: RecipeResponseDto,
  })
  async update(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.update(
      id,
      storeId || '01915dfa-9012-7000-8000-000000000002',
      dto,
    );
  }

  @Delete(':id')
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Soft delete a recipe' })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully deleted',
  })
  async delete(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<{ success: boolean; id: string }> {
    const success = await this.recipesService.delete(
      id,
      storeId || '01915dfa-9012-7000-8000-000000000002',
    );
    return { success, id };
  }

  @Post(':id/deduct')
  @Roles('admin', 'superadmin', 'manager', 'supervisor', 'staff')
  @ApiOperation({ summary: 'Execute Bill of Materials (BOM) inventory deduction' })
  @ApiResponse({
    status: 200,
    description: 'BOM deduction successfully processed',
    type: RecipeDeductionResponseDto,
  })
  async deduct(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('name') actorName: string,
    @Body() dto: DeductRecipeDto,
  ): Promise<RecipeDeductionResponseDto> {
    return this.recipesService.deductRecipe(
      id,
      storeId || '01915dfa-9012-7000-8000-000000000002',
      actorId || '01915dfa-b1c4-7221-9988-51b72e04e001',
      actorName || 'Staff Member',
      dto,
    );
  }
}
