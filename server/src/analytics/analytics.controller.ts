import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

@ApiTags('Reports')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('reports')
export class ReportsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @RequirePermissions('analytics:export_reports')
  @ApiOperation({ summary: 'Get list of available reports' })
  async getReports() {
    return [
      {
        id: 'rep-1',
        title: 'Inventory Valuation Report',
        description: 'Detailed category valuation breakdown and live asset totals.',
        category: 'Inventory',
        icon: 'TrendingDown',
        lastGenerated: 'Yesterday',
      },
      {
        id: 'rep-2',
        title: 'Stock Discrepancy & Variance Ledger',
        description: 'Comprehensive historical variance logs with cost discrepancy impacts.',
        category: 'Variance',
        icon: 'ClipboardList',
        lastGenerated: '3 days ago',
      },
      {
        id: 'rep-3',
        title: 'BBD Spoilage & Waste Analysis',
        description: 'Preventative analysis on near-expiration batches and Promo conversions.',
        category: 'Waste',
        icon: 'AlertTriangle',
        lastGenerated: '1 week ago',
      },
      {
        id: 'rep-4',
        title: 'Procurement & Purchase Order History',
        description: 'Vendor delivery speed, fulfillments, and purchase ledger totals.',
        category: 'Purchasing',
        icon: 'ShoppingBag',
        lastGenerated: 'Never',
      },
    ];
  }

  @Get('archive')
  @RequirePermissions('analytics:export_reports')
  @ApiOperation({ summary: 'Get archived report outputs' })
  async getArchiveReports() {
    return [
      {
        id: 'arc-1',
        title: 'Inventory_Valuation_Aug2026.pdf',
        size: '142 KB',
        date: 'Aug 20, 2026',
        format: 'PDF',
      },
      {
        id: 'arc-2',
        title: 'Variance_Report_Week33.xlsx',
        size: '98 KB',
        date: 'Aug 17, 2026',
        format: 'EXCEL',
      },
    ];
  }

  @Post(':id/generate')
  @RequirePermissions('analytics:export_reports')
  @ApiOperation({ summary: 'Generate and export a report' })
  async generateReport(@Param('id') id: string, @Body() dto: { format: string }) {
    return {
      success: true,
      url: `https://storage.googleapis.com/stockpulse-reports/store-1/${id}_generated.${dto.format === 'pdf' ? 'pdf' : 'xlsx'}`,
    };
  }
}
