import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('health')
  @RequirePermissions('inventory:view')
  @ApiOperation({ summary: 'Get store inventory health score and status distribution' })
  async getInventoryHealth(@CurrentStore() storeId: string) {
    return this.analyticsService.getInventoryHealth(storeId);
  }

  @Get('valuation')
  @RequirePermissions('inventory:view')
  @ApiOperation({ summary: 'Get total inventory stock valuation and category breakdown' })
  async getStockValuation(@CurrentStore() storeId: string) {
    return this.analyticsService.getStockValuation(storeId);
  }

  @Get('variance')
  @RequirePermissions('inventory:view')
  @ApiOperation({ summary: 'Get store stock count variance analytics and trends' })
  async getVarianceAnalytics(@CurrentStore() storeId: string) {
    return this.analyticsService.getVarianceAnalytics(storeId);
  }

  @Get('waste-suggestions')
  @RequirePermissions('inventory:view')
  @ApiOperation({ summary: 'Get proactive recipe waste reduction suggestions for near-expiry stock' })
  async getWasteSuggestions(@CurrentStore() storeId: string) {
    return this.analyticsService.getWasteSuggestions(storeId);
  }
}
