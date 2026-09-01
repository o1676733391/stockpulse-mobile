import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RecipesController } from './recipes.controller';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RecipesController],
  providers: [RecipesService, RecipesRepository],
  exports: [RecipesService, RecipesRepository],
})
export class RecipesModule {}
