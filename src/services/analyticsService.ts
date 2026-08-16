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
    labels: ['10 Feb', '17 Feb', '24 Feb', '3 Mar', '10 Mar'],
    values: [-3.2, -2.8, -2.1, -1.9, -1.8],
  },
  topDiscrepancies: [
    { name: 'Chicken Breast', variancePct: -9.3, valueImpact: -112.80, isNegative: true },
    { name: 'Whole Milk',    variancePct: -6.5, valueImpact: -44.20,  isNegative: true },
    { name: 'Cooking Oil',   variancePct: -4.8, valueImpact: -38.40,  isNegative: true },
    { name: 'Tomatoes',      variancePct: +2.1, valueImpact: +12.60,  isNegative: false },
  ],
};

export const INITIAL_WASTE_DATA: WasteAnalytics = {
  monthlyWasteCost: 240.50,
  monthlyWasteSaved: 160.28,
  wasteReductionPct: 36.8,
  trend: {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    values: [480, 420, 390, 380, 240.5],
  },
  breakdown: [
    { reason: 'Expired Stock',     cost: 114.20, pct: 47.5, color: '#dc2626' },
    { reason: 'Prep & Trimming',   cost: 78.30,  pct: 32.5, color: '#d97706' },
    { reason: 'Handling & Spoilage', cost: 48.00,  pct: 20.0, color: '#64748b' },
  ],
};

export const INITIAL_PURCHASE_DATA: PurchaseAnalytics = {
  ytdSpend: 7940.00,
  monthlyBudget: 3500.00,
  monthlyActual: 3120.00,
  monthlyTrend: {
    labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    spend: [2950, 3400, 3100, 2890, 3120],
    budget: [3500, 3500, 3500, 3500, 3500],
  },
};

export const INITIAL_SUPPLIER_PERF: SupplierPerformance[] = [
  {
    id: 's1',
    name: 'Metro Foods GmbH',
    contact: 'Klaus Weber',
    phone: '+49 30 1234 5678',
    email: 'orders@metrofoods.de',
    onTimeRate: 94,
    avgLeadDays: 2,
    totalOrders: 18,
    ytdSpend: 4820.00,
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
    onTimeRate: 98,
    avgLeadDays: 1,
    totalOrders: 12,
    ytdSpend: 2140.00,
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
    onTimeRate: 88,
    avgLeadDays: 3,
    totalOrders: 7,
    ytdSpend: 980.00,
    openOrders: 2,
    ingredientCount: 8,
    lastDelivery: '07 Mar 2026',
  },
];

export const INITIAL_REPORT_ITEMS: ReportItem[] = [
  { id: 'rep-1', title: 'Daily Inventory Report',   category: 'Inventory',  frequency: 'Daily',     lastGenerated: 'Today, 06:00', iconName: 'Package' },
  { id: 'rep-2', title: 'Weekly Inventory Report',  category: 'Inventory',  frequency: 'Weekly',    lastGenerated: '07 Mar 2026',  iconName: 'BarChart2' },
  { id: 'rep-3', title: 'Monthly Valuation Report', category: 'Inventory',  frequency: 'Monthly',   lastGenerated: '01 Mar 2026',  iconName: 'TrendingUp' },
  { id: 'rep-4', title: 'Variance Audit Report',    category: 'Variance',   frequency: 'On demand', lastGenerated: '08 Mar 2026',  iconName: 'Scale' },
  { id: 'rep-5', title: 'Waste & Loss Summary',     category: 'Waste',      frequency: 'On demand', lastGenerated: '05 Mar 2026',  iconName: 'Trash2' },
  { id: 'rep-6', title: 'Goods Receipt Audit',      category: 'Receipts',   frequency: 'On demand', lastGenerated: '10 Mar 2026',  iconName: 'Truck' },
  { id: 'rep-7', title: 'Purchasing & Spend Report',category: 'Purchasing', frequency: 'On demand', lastGenerated: '03 Mar 2026',  iconName: 'ShoppingCart' },
  { id: 'rep-8', title: 'System Security & Audit',  category: 'Audit',      frequency: 'On demand', lastGenerated: '28 Feb 2026',  iconName: 'ShieldCheck' },
];

export const INITIAL_ARCHIVE_REPORTS: ArchiveReport[] = [
  { name: 'Monthly Inventory Report — Mar 2026', size: '2.4 MB', date: '01 Mar 2026', year: '2026', month: 'March' },
  { name: 'Variance Audit Report — Feb 2026',    size: '840 KB', date: '28 Feb 2026', year: '2026', month: 'February' },
  { name: 'Waste Reduction Report — Feb 2026',   size: '512 KB', date: '28 Feb 2026', year: '2026', month: 'February' },
  { name: 'Annual Valuation Report — 2025',      size: '8.4 MB', date: '01 Jan 2026', year: '2025', month: 'January' },
];

export class MockAnalyticsService implements IAnalyticsService {
  async getInventoryHealth(): Promise<InventoryHealthAnalytics> {
    return { ...INITIAL_HEALTH_DATA };
  }

  async getStockValuation(): Promise<StockValuationAnalytics> {
    return JSON.parse(JSON.stringify(INITIAL_VALUATION_DATA));
  }

  async getVarianceAnalytics(): Promise<VarianceAnalytics> {
    return JSON.parse(JSON.stringify(INITIAL_VARIANCE_DATA));
  }

  async getWasteAnalytics(): Promise<WasteAnalytics> {
    return JSON.parse(JSON.stringify(INITIAL_WASTE_DATA));
  }

  async getPurchaseAnalytics(): Promise<PurchaseAnalytics> {
    return JSON.parse(JSON.stringify(INITIAL_PURCHASE_DATA));
  }

  async getSupplierPerformance(): Promise<SupplierPerformance[]> {
    return JSON.parse(JSON.stringify(INITIAL_SUPPLIER_PERF));
  }

  async getReports(): Promise<ReportItem[]> {
    return JSON.parse(JSON.stringify(INITIAL_REPORT_ITEMS));
  }

  async getArchiveReports(): Promise<ArchiveReport[]> {
    return JSON.parse(JSON.stringify(INITIAL_ARCHIVE_REPORTS));
  }

  async generateReport(reportId: string, format: 'pdf' | 'excel'): Promise<{ success: boolean; url: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, url: `https://stockpulse.local/exports/${reportId}.${format}` });
      }, 1200);
    });
  }
}

export const analyticsService: IAnalyticsService = new MockAnalyticsService();
