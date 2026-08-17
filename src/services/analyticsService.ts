import {
  ArchiveReport,
  InventoryHealthAnalytics,
  PurchaseAnalytics,
  ReportItem,
  StockValuationAnalytics,
  SupplierPerformance,
  VarianceAnalytics,
  WasteAnalytics,
} from '@/types/analytics';
import { apiClient, logDebugFallback } from './apiClient';

export interface IAnalyticsService {
  getInventoryHealth(): Promise<InventoryHealthAnalytics>;
  getStockValuation(): Promise<StockValuationAnalytics>;
  getVarianceAnalytics(): Promise<VarianceAnalytics>;
  getWasteAnalytics(): Promise<WasteAnalytics>;
  getPurchaseAnalytics(): Promise<PurchaseAnalytics>;
  getSupplierPerformance(): Promise<SupplierPerformance[]>;
  getReports(): Promise<ReportItem[]>;
  getArchiveReports(): Promise<ArchiveReport[]>;
  generateReport(reportId: string, format: 'pdf' | 'excel'): Promise<{ success: boolean; url: string }>;
}

export const INITIAL_HEALTH_DATA: InventoryHealthAnalytics = {
  totalItems: 68,
  healthScore: 92,
  optimalCount: 52,
  lowStockCount: 8,
  overstockCount: 6,
  outOfStockCount: 2,
  turnoverDays: 14.2,
};

export const INITIAL_VALUATION_DATA: StockValuationAnalytics = {
  totalValuation: 18420.00,
  trend7D: {
    labels: ['4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar'],
    values: [18200, 17900, 18100, 17800, 18250, 18350, 18420],
  },
  trend30D: {
    labels: ['10 Feb', '17 Feb', '24 Feb', '3 Mar', '10 Mar'],
    values: [16800, 17200, 17950, 18100, 18420],
  },
  trend3M: {
    labels: ['Dec', 'Jan', 'Feb', 'Mar'],
    values: [15400, 16200, 17500, 18420],
  },
  categoryBreakdown: [
    { category: 'Meat & Poultry', value: 6840, percentage: 37.1, color: '#dc2626' },
    { category: 'Fish & Seafood', value: 4210, percentage: 22.9, color: '#0284c7' },
    { category: 'Dairy & Cheese', value: 2980, percentage: 16.2, color: '#d97706' },
    { category: 'Dry Goods',     value: 2450, percentage: 13.3, color: '#059669' },
    { category: 'Vegetables',    value: 1940, percentage: 10.5, color: '#16a34a' },
  ],
};

export const INITIAL_VARIANCE_DATA: VarianceAnalytics = {
  overallVarianceRate: -1.8,
  netVarianceValue: -342.50,
  trend: {
    labels: ['4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar'],
    values: [-1.2, -1.5, -2.1, -1.8, -1.6, -2.0, -1.8],
  },
  topDiscrepancies: [
    { name: 'Fresh Salmon', variancePct: -30.0, valueImpact: 29.16, isNegative: true },
    { name: 'Chicken Breast', variancePct: -9.2, valueImpact: 12.00, isNegative: true },
    { name: 'Whole Milk', variancePct: -23.8, valueImpact: 2.75, isNegative: true },
    { name: 'Potatoes', variancePct: -4.4, valueImpact: 1.98, isNegative: true },
    { name: 'Romaine Lettuce', variancePct: -22.5, valueImpact: 1.98, isNegative: true },
  ],
};

export const INITIAL_WASTE_DATA: WasteAnalytics = {
  monthlyWasteCost: 486.20,
  monthlyWasteSaved: 215.40,
  wasteReductionPct: 30.7,
  trend: {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    values: [680, 620, 550, 510, 486],
  },
  breakdown: [
    { reason: 'Near Expiry', cost: 240, pct: 49.3, color: '#ef4444' },
    { reason: 'Spoiled', cost: 146.2, pct: 30.1, color: '#f59e0b' },
    { reason: 'Damaged', cost: 100, pct: 20.6, color: '#3b82f6' },
  ],
};

export const INITIAL_PURCHASE_ANALYTICS: PurchaseAnalytics = {
  ytdSpend: 28850.00,
  monthlyBudget: 5000.00,
  monthlyActual: 4210.80,
  monthlyTrend: {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    spend: [3800, 4500, 3900, 4100, 4210],
    budget: [4500, 5000, 4500, 4500, 5000],
  },
};

export const INITIAL_PURCHASE_DATA = INITIAL_PURCHASE_ANALYTICS;

export const INITIAL_SUPPLIER_PERF: SupplierPerformance[] = [
  {
    id: 's1',
    name: 'Metro Foods GmbH',
    contact: 'Klaus Weber',
    phone: '+49 30 1234 5678',
    email: 'orders@metrofoods.de',
    onTimeRate: 96.5,
    avgLeadDays: 2,
    totalOrders: 28,
    ytdSpend: 14280.00,
    openOrders: 1,
    ingredientCount: 24,
    lastDelivery: '08 Mar 2026',
  },
  {
    id: 's2',
    name: 'FreshProduce GmbH',
    contact: 'Lena Müller',
    phone: '+49 89 9876 5432',
    email: 'lena@freshproduce.de',
    onTimeRate: 91.2,
    avgLeadDays: 1,
    totalOrders: 18,
    ytdSpend: 8450.00,
    openOrders: 0,
    ingredientCount: 12,
    lastDelivery: '09 Mar 2026',
  },
  {
    id: 's3',
    name: 'Alpine Dairy Co.',
    contact: 'Hans Berger',
    phone: '+43 1 555 0123',
    email: 'h.berger@alpinedairy.at',
    onTimeRate: 98.0,
    avgLeadDays: 3,
    totalOrders: 14,
    ytdSpend: 6120.00,
    openOrders: 2,
    ingredientCount: 8,
    lastDelivery: '07 Mar 2026',
  },
];

export const INITIAL_REPORTS: ReportItem[] = [
  { id: 'rep-1', title: 'Monthly Inventory Valuation', category: 'Inventory', frequency: 'Monthly', lastGenerated: '01 Mar 2026', iconName: 'FileText' },
  { id: 'rep-2', title: 'Stock Variance & Discrepancy Audit', category: 'Variance', frequency: 'Weekly', lastGenerated: '08 Mar 2026', iconName: 'TrendingDown' },
  { id: 'rep-3', title: 'Food Waste & Spoilage Summary', category: 'Waste', frequency: 'Monthly', lastGenerated: '01 Mar 2026', iconName: 'Trash2' },
  { id: 'rep-4', title: 'Supplier Spend & Lead Time Report', category: 'Purchasing', frequency: 'Monthly', lastGenerated: '01 Mar 2026', iconName: 'Truck' },
];

export const INITIAL_REPORT_ITEMS = INITIAL_REPORTS;

export const INITIAL_ARCHIVES: ArchiveReport[] = [
  { name: 'Annual Financial Closing Inventory', size: '2.4 MB', date: '31 Dec 2025', year: '2025', month: 'Dec' },
  { name: 'Q3 Certified Audit Statement', size: '1.8 MB', date: '30 Sep 2025', year: '2025', month: 'Sep' },
  { name: 'Mid-Year Comprehensive Stocktake', size: '3.1 MB', date: '30 Jun 2025', year: '2025', month: 'Jun' },
];

export const INITIAL_ARCHIVE_REPORTS = INITIAL_ARCHIVES;

export class RealAnalyticsService implements IAnalyticsService {
  async getInventoryHealth(): Promise<InventoryHealthAnalytics> {
    try {
      return await apiClient.get<InventoryHealthAnalytics>('/analytics/health');
    } catch (err) {
      logDebugFallback('AnalyticsService', '/analytics/health', err);
      return { ...INITIAL_HEALTH_DATA };
    }
  }

  async getStockValuation(): Promise<StockValuationAnalytics> {
    try {
      return await apiClient.get<StockValuationAnalytics>('/analytics/valuation');
    } catch (err) {
      logDebugFallback('AnalyticsService', '/analytics/valuation', err);
      return { ...INITIAL_VALUATION_DATA };
    }
  }

  async getVarianceAnalytics(): Promise<VarianceAnalytics> {
    try {
      return await apiClient.get<VarianceAnalytics>('/analytics/variance');
    } catch (err) {
      logDebugFallback('AnalyticsService', '/analytics/variance', err);
      return { ...INITIAL_VARIANCE_DATA };
    }
  }

  async getWasteAnalytics(): Promise<WasteAnalytics> {
    return { ...INITIAL_WASTE_DATA };
  }

  async getPurchaseAnalytics(): Promise<PurchaseAnalytics> {
    return { ...INITIAL_PURCHASE_ANALYTICS };
  }

  async getSupplierPerformance(): Promise<SupplierPerformance[]> {
    return [...INITIAL_SUPPLIER_PERF];
  }

  async getReports(): Promise<ReportItem[]> {
    return [...INITIAL_REPORTS];
  }

  async getArchiveReports(): Promise<ArchiveReport[]> {
    return [...INITIAL_ARCHIVES];
  }

  async generateReport(reportId: string, format: 'pdf' | 'excel'): Promise<{ success: boolean; url: string }> {
    return { success: true, url: `https://example.com/reports/${reportId}.${format}` };
  }
}

export const analyticsService: IAnalyticsService = new RealAnalyticsService();
