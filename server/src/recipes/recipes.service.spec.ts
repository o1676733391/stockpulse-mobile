import { Test, TestingModule } from '@nestjs/testing';
import { CreateRecipeDto, RecipeResponseDto, UpdateRecipeDto } from './dto/recipe.dto';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;
  let repository: jest.Mocked<RecipesRepository>;

  const mockRecipe: RecipeResponseDto = {
    id: 'rec-01',
    storeId: 'store-01',
    code: 'REC-PIZZA',
    name: 'Pizza Margherita',
    category: 'Pizza',
    portionYield: 1,
    posItemName: 'Pizza Margherita',
    isActive: true,
    costPerPortion: 2.5,
    ingredients: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findPaginated: jest.fn().mockResolvedValue([mockRecipe]),
      findById: jest.fn().mockResolvedValue(mockRecipe),
      create: jest.fn().mockResolvedValue(mockRecipe),
      update: jest.fn().mockResolvedValue(mockRecipe),
      delete: jest.fn().mockResolvedValue(true),
      deductRecipe: jest.fn().mockResolvedValue({
        success: true,
        recipeId: 'rec-01',
        recipeName: 'Pizza Margherita',
        quantityDeducted: 1,
        deductions: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    repository = module.get(RecipesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPaginated', () => {
    it('should return paginated recipes', async () => {
      const result = await service.findPaginated('store-01');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('REC-PIZZA');
    });
  });

  describe('create', () => {
    it('should create a recipe', async () => {
      const dto: CreateRecipeDto = {
        code: 'REC-PIZZA',
        name: 'Pizza Margherita',
      };
      const result = await service.create('store-01', dto);
      expect(result.name).toBe('Pizza Margherita');
    });
  });

  describe('update', () => {
    it('should update a recipe', async () => {
      const dto: UpdateRecipeDto = { name: 'Updated Pizza' };
      const result = await service.update('rec-01', 'store-01', dto);
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a recipe', async () => {
      const result = await service.delete('rec-01', 'store-01');
      expect(result).toBe(true);
    });
  });

  describe('deductRecipe', () => {
    it('should deduct a recipe and update inventory', async () => {
      const result = await service.deductRecipe('rec-01', 'store-01', 'actor-01', 'Staff', { quantity: 1 });
      expect(result.success).toBe(true);
      expect(result.recipeId).toBe('rec-01');
    });
  });
});
