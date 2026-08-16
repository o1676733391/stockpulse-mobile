export interface InventoryHealthAnalytics {
  totalItems: number;
  healthScore: number;
  optimalCount: number;
  lowStockCount: number;
  overstockCount: number;
  outOfStockCount: number;
  turnoverDays: number;
}

export interface StockValuationAnalytics {
  totalValuation: number;
  trend7D: { labels: string[]; values: number[] };
  trend30D: { labels: string[]; values: number[] };
  trend3M: { labels: string[]; values: number[] };
  categoryBreakdown: Array<{
    category: string;
    value: number;
    percentage: number;
    color: string;
  }>;
}

export interface VarianceAnalytics {
  overallVarianceRate: number;
  netVarianceValue: number;
  trend: { labels: string[]; values: number[] };
  topDiscrepancies: Array<{
    name: string;
    variancePct: number;
    valueImpact: number;
    isNegative: boolean;
  }>;
}

export interface WasteAnalytics {
  monthlyWasteCost: number;
  monthlyWasteSaved: number;
  wasteReductionPct: number;
  trend: { labels: string[]; values: number[] };
  breakdown: Array<{
    reason: string;
    cost: number;
    pct: number;
    color: string;
  }>;
}

export interface PurchaseAnalytics {
  ytdSpend: number;
  monthlyBudget: number;
  monthlyActual: number;
  monthlyTrend: {
    labels: string[];
    spend: number[];
    budget: number[];
  };
}

export interface SupplierPerformance {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  onTimeRate: number;
  avgLeadDays: number;
  totalOrders: number;
  ytdSpend: number;
  openOrders: number;
  ingredientCount: number;
  lastDelivery: string;
}

export interface ReportItem {
  id: string;
  title: string;
  category: 'Inventory' | 'Variance' | 'Waste' | 'Receipts' | 'Purchasing' | 'Audit';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Annual' | 'On demand';
  lastGenerated: string;
  iconName: string;
}

export interface ArchiveReport {
  name: string;
  size: string;
  date: string;
  year: string;
  month: string;
}
