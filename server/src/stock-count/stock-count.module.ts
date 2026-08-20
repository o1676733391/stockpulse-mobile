import { Module } from '@nestjs/common';
import { StockCountController } from './stock-count.controller';
import { StockCountRepository } from './stock-count.repository';
import { StockCountService } from './stock-count.service';

@Module({
  controllers: [StockCountController],
  providers: [StockCountService, StockCountRepository],
  exports: [StockCountService, StockCountRepository],
})
export class StockCountModule {}
