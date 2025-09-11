/**
 * أنواع البيانات للوحات الإدارة
 */

import { ID, Timestamp, Status } from './common';

// أنواع النسخ الاحتياطية
export interface BackupMetadata {
  id: ID;
  name: string;
  description?: string;
  type: 'manual' | 'scheduled' | 'auto';
  size: number;
  createdAt: Timestamp;
  status?: 'creating' | 'completed' | 'failed';
  checksum?: string;
}

export interface BackupStats {
  total: number;
  manual: number;
  scheduled: number;
  auto: number;
  totalSize: number;
  lastBackup?: Timestamp;
}

export interface BackupConfig {
  includeData: boolean;
  includeSettings: boolean;
  includeIntegrations: boolean;
  includePlugins: boolean;
  includeAnalytics: boolean;
  compression: 'none' | 'basic' | 'high';
  encryption: boolean;
  scheduleEnabled: boolean;
  scheduleInterval: number;
}

export interface RestoreOptions {
  overwrite: boolean;
  backupData?: boolean;
  restoreSettings?: boolean;
  restoreIntegrations?: boolean;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restoredItems?: number;
  errors?: string[];
}

// أنواع المراقبة
export interface SystemHealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  responseTime: number;
  lastChecked: Timestamp;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  score: number;
  summary: {
    healthy: number;
    warning: number;
    critical: number;
  };
  checks: Record<string, SystemHealthCheck>;
  lastUpdated: Timestamp;
}

export interface UsageStats {
  realTime: {
    today: {
      events: number;
      features: number;
      errors: number;
    };
    session: {
      duration: number;
      actions: number;
      features: number;
    };
  };
  weekly?: {
    summary: {
      totalEvents: number;
      uniqueFeatures: number;
      averageSessionTime: number;
      peakHour: string;
    };
    dailyBreakdown: Array<{
      date: string;
      events: number;
      sessionTime: number;
    }>;
  };
}

export interface MaintenanceTask {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Timestamp;
  endTime?: Timestamp;
  error?: string;
}

export interface MaintenanceResult {
  success: boolean;
  tasks: MaintenanceTask[];
  error?: string;
  duration?: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  healthCheckInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    diskUsage: number;
  };
  notifications: {
    email: boolean;
    inApp: boolean;
    webhook?: string;
  };
  retentionDays: number;
}

// أنواع التقارير المتقدمة
export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  reportType: string;
  customerId?: string;
  productCategory?: string;
  supplierId?: string;
}

export interface ProfitabilityReport {
  revenue: {
    totalSales: number;
    salesCount: number;
    averageSaleValue: number;
    topProducts: Array<{
      id: ID;
      name: string;
      sales: number;
      revenue: number;
    }>;
  };
  costs: {
    totalCosts: number;
    costBreakdown: Record<string, number>;
    costPerSale: number;
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    profitTrend: Array<{
      date: string;
      profit: number;
    }>;
  };
}

export interface CashFlowReport {
  transactions: {
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    cashBalance: number;
  };
  breakdown: {
    sales: number;
    purchases: number;
    expenses: number;
    other: number;
  };
  trends: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

export interface PerformanceReport {
  customers: {
    totalCustomers: number;
    activeCustomers: number;
    topCustomers: Array<{
      id: ID;
      name: string;
      totalPurchases: number;
      lastPurchase: Timestamp;
    }>;
    retentionRate: number;
  };
  suppliers: {
    totalSuppliers: number;
    activeSuppliers: number;
    topSuppliers: Array<{
      id: ID;
      name: string;
      totalOrders: number;
      lastOrder: Timestamp;
    }>;
    reliabilityScore: number;
  };
  inventory: {
    totalProducts: number;
    lowStockItems: number;
    turnoverRate: number;
    deadStock: number;
  };
}

export interface IntegrationReport {
  systemConnectivity: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  dataIntegrity: {
    syncRate: number;
    conflicts: number;
    lastSync: Timestamp;
  };
  performance: {
    avgResponseTime: number;
    throughput: number;
    resourceUsage: number;
  };
}

export interface RisksReport {
  financial: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: number;
    recommendation: string;
  }>;
  operational: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    probability: number;
    mitigation: string;
  }>;
  technical: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    urgency: number;
    solution: string;
  }>;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'funnel' | 'composed';
  title: string;
  data: ChartDataPoint[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
}

export interface ReportSection {
  title: string;
  description?: string;
  charts: ChartConfig[];
  tables?: Array<{
    title: string;
    headers: string[];
    rows: Array<Record<string, unknown>>;
  }>;
  insights?: Array<{
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    message: string;
    value?: number | string;
  }>;
}

export interface ComprehensiveReport {
  metadata: {
    id: ID;
    title: string;
    period: {
      startDate: Timestamp;
      endDate: Timestamp;
    };
    generatedAt: Timestamp;
    generatedBy: ID;
  };
  sections: ReportSection[];
  summary: {
    keyMetrics: Record<string, number | string>;
    insights: string[];
    recommendations: string[];
  };
}