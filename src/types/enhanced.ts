/**
 * أنواع البيانات المحسنة والآمنة لاستبدال any types
 */

// أنواع النظام الأساسية
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
  lastUpdated: string;
}

export interface HealthCheck {
  id: string;
  name: string;
  status: 'passing' | 'warning' | 'failing';
  message: string;
  lastCheck: string;
  interval: number;
  type: 'system' | 'database' | 'api' | 'storage';
}

export interface UsageStats {
  dailyActiveUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  topFeatures: Array<{
    name: string;
    usage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  performanceMetrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
  };
}

export interface BackupStats {
  totalBackups: number;
  lastBackup: {
    date: string;
    size: number;
    status: 'success' | 'failed' | 'in_progress';
  };
  list: Array<{
    id: string;
    date: string;
    size: number;
    type: 'manual' | 'automatic';
    status: 'success' | 'failed';
  }>;
  settings: {
    autoBackup: boolean;
    interval: number;
    retention: number;
  };
}

export interface MaintenanceConfig {
  autoCleanup: boolean;
  cleanupInterval: number;
  logRetention: number;
  performanceMonitoring: boolean;
  alertThresholds: {
    memory: number;
    storage: number;
    errorRate: number;
  };
  scheduledMaintenance: {
    enabled: boolean;
    time: string;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

// أنواع التراخيص
export interface GeneratedLicense {
  id: string;
  licenseKey: string;
  customerName: string;
  customerEmail: string;
  features: string[];
  validUntil: string;
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
  maxUsers: number;
  maxDevices: number;
}

export interface LicenseFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'basic' | 'premium' | 'enterprise';
}

// أنواع الموظفين
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: string;
  salary?: number;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'emergency' | 'maternity' | 'unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  rating: number; // 1-5
  goals: Array<{
    description: string;
    achieved: boolean;
    notes?: string;
  }>;
  strengths: string[];
  improvements: string[];
  reviewerComments: string;
  employeeComments?: string;
  reviewDate: string;
  reviewerId: string;
}

// أنواع التقارير والتحليلات
export interface ReportData {
  type: 'comprehensive' | 'profit' | 'cashflow' | 'performance' | 'integration' | 'risks';
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  data: any; // سيتم تحسينها لاحقاً حسب نوع التقرير
  summary: {
    totalRevenue?: number;
    totalExpenses?: number;
    netProfit?: number;
    growthRate?: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// أنواع الإعدادات
export interface AppSettings {
  general: {
    language: 'ar' | 'en';
    theme: 'light' | 'dark' | 'auto';
    currency: string;
    dateFormat: string;
    numberFormat: string;
  };
  appearance: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    lowStock: boolean;
    overduePayments: boolean;
  };
  security: {
    sessionTimeout: number;
    requireTwoFactor: boolean;
    passwordComplexity: 'low' | 'medium' | 'high';
    loginAttempts: number;
  };
  integration: {
    autoSync: boolean;
    syncInterval: number;
    apiKeys: Record<string, string>;
  };
  performance: {
    cacheEnabled: boolean;
    compressionEnabled: boolean;
    lazyLoading: boolean;
    preloadData: boolean;
  };
  backup: {
    autoBackup: boolean;
    interval: number;
    retention: number;
    location: 'local' | 'cloud';
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
    logo?: string;
  };
}

// Type guards محسنة للتحقق من الأنواع
export function isSystemHealth(value: unknown): value is SystemHealth {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.status === 'string' &&
    ['healthy', 'warning', 'error'].includes(obj.status) &&
    typeof obj.uptime === 'number' &&
    typeof obj.memory === 'object' &&
    typeof obj.storage === 'object' &&
    typeof obj.lastUpdated === 'string'
  );
}

export function isHealthCheck(value: unknown): value is HealthCheck {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.status === 'string' &&
    ['passing', 'warning', 'failing'].includes(obj.status) &&
    typeof obj.message === 'string' &&
    typeof obj.lastCheck === 'string' &&
    typeof obj.interval === 'number'
  );
}

export function isGeneratedLicense(value: unknown): value is GeneratedLicense {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.licenseKey === 'string' &&
    typeof obj.customerName === 'string' &&
    typeof obj.customerEmail === 'string' &&
    Array.isArray(obj.features) &&
    typeof obj.validUntil === 'string' &&
    typeof obj.createdAt === 'string'
  );
}

export function isEmployee(value: unknown): value is Employee {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.position === 'string' &&
    typeof obj.department === 'string' &&
    typeof obj.hireDate === 'string'
  );
}

// دوال تحويل البيانات من any إلى أنواع محددة
export function convertToSystemHealth(value: any): SystemHealth | null {
  if (isSystemHealth(value)) return value;
  
  if (typeof value !== 'object' || value === null) return null;
  
  try {
    return {
      status: value.status || 'warning',
      uptime: Number(value.uptime) || 0,
      memory: {
        used: Number(value.memory?.used) || 0,
        total: Number(value.memory?.total) || 100,
        percentage: Number(value.memory?.percentage) || 0
      },
      storage: {
        used: Number(value.storage?.used) || 0,
        available: Number(value.storage?.available) || 100,
        percentage: Number(value.storage?.percentage) || 0
      },
      lastUpdated: value.lastUpdated || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function convertToGeneratedLicense(value: any): GeneratedLicense | null {
  if (isGeneratedLicense(value)) return value;
  
  if (typeof value !== 'object' || value === null) return null;
  
  try {
    return {
      id: String(value.id || ''),
      licenseKey: String(value.licenseKey || ''),
      customerName: String(value.customerName || ''),
      customerEmail: String(value.customerEmail || ''),
      features: Array.isArray(value.features) ? value.features : [],
      validUntil: String(value.validUntil || ''),
      createdAt: String(value.createdAt || new Date().toISOString()),
      status: ['active', 'expired', 'revoked'].includes(value.status) ? value.status : 'active',
      maxUsers: Number(value.maxUsers) || 1,
      maxDevices: Number(value.maxDevices) || 1
    };
  } catch {
    return null;
  }
}