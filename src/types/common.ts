/**
 * أنواع البيانات المشتركة في التطبيق
 * تستبدل جميع استخدامات any
 */

// أنواع البيانات الأساسية
export type ID = string | number;
export type Timestamp = string;
export type Currency = number;
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

// أنواع الاستجابات من APIs
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// أنواع الأخطاء
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
  userId?: ID;
}

// أنواع البيانات التجارية
export interface Customer {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit?: Currency;
  currentBalance: Currency;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: Status;
  metadata?: Record<string, unknown>;
}

export interface Supplier {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  currentBalance: Currency;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: Status;
  metadata?: Record<string, unknown>;
}

export interface Product {
  id: ID;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: ID;
  unitPrice: Currency;
  costPrice: Currency;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  images?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: Status;
  metadata?: Record<string, unknown>;
}

export interface Invoice {
  id: ID;
  invoiceNumber: string;
  customerId?: ID;
  supplierId?: ID;
  type: 'sale' | 'purchase';
  items: InvoiceItem[];
  subtotal: Currency;
  tax: Currency;
  discount: Currency;
  total: Currency;
  paidAmount: Currency;
  remainingAmount: Currency;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceItem {
  id: ID;
  productId: ID;
  productName: string;
  quantity: number;
  unitPrice: Currency;
  discount: Currency;
  total: Currency;
  metadata?: Record<string, unknown>;
}

// أنواع المستخدمين
export interface User {
  id: ID;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  status: Status;
  preferences?: UserPreferences;
  metadata?: Record<string, unknown>;
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'viewer';

export interface Permission {
  resource: string;
  actions: string[];
}

export interface UserPreferences {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  currency: string;
  dateFormat: string;
  timezone: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: string[];
}

// أنواع التقارير
export interface ReportData {
  type: string;
  period: DateRange;
  data: Record<string, unknown>;
  charts: ChartData[];
  summary: ReportSummary;
  generatedAt: Timestamp;
  generatedBy: ID;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  config?: Record<string, unknown>;
}

export interface ReportSummary {
  totalRevenue?: Currency;
  totalCost?: Currency;
  profit?: Currency;
  profitMargin?: number;
  itemsSold?: number;
  customersCount?: number;
  averageOrderValue?: Currency;
  metrics: Record<string, number>;
}

export interface DateRange {
  startDate: Timestamp;
  endDate: Timestamp;
}

// أنواع النسخ الاحتياطي
export interface BackupMetadata {
  id: ID;
  name: string;
  size: number;
  createdAt: Timestamp;
  createdBy: ID;
  type: 'manual' | 'automatic';
  status: 'creating' | 'completed' | 'failed';
  includesData: boolean;
  includesSettings: boolean;
  includesFiles: boolean;
  checksum?: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    customers?: Customer[];
    suppliers?: Supplier[];
    products?: Product[];
    invoices?: Invoice[];
    users?: User[];
    settings?: AppSettings;
  };
}

// أنواع الإعدادات
export interface AppSettings {
  company: CompanySettings;
  system: SystemSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  backup: BackupSettings;
  security: SecuritySettings;
}

export interface CompanySettings {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  currency: string;
  language: string;
}

export interface SystemSettings {
  autoBackup: boolean;
  backupInterval: number;
  maxBackups: number;
  debugMode: boolean;
  performanceMode: 'high' | 'balanced' | 'battery';
  cacheSize: number;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showAnimations: boolean;
}

export interface BackupSettings {
  includeData: boolean;
  includeSettings: boolean;
  includeFiles: boolean;
  compression: boolean;
  encryption: boolean;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  retention: number;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  auditLog: boolean;
  encryptStorage: boolean;
  allowedIPs?: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  expiryDays: number;
}

// أنواع الأحداث والتتبع
export interface ActivityLog {
  id: ID;
  userId: ID;
  action: string;
  resource: string;
  resourceId?: ID;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
  status: 'success' | 'failed';
}

export interface PerformanceMetric {
  id: ID;
  metric: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  context?: Record<string, unknown>;
}

// أنواع النماذج
export interface FormField {
  name: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'date' | 'textarea';
  label: string;
  required: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
  options?: SelectOption[];
  defaultValue?: unknown;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// أنواع مكونات UI
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, unknown>) => void;
}

// أنواع الحالة (State)
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: AppError | null;
  settings: AppSettings;
  notifications: NotificationItem[];
}

export interface NotificationItem {
  id: ID;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

// أنواع الـ Hooks
export interface UseApiOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: AppError) => void;
  retry?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheDuration?: number;
}

export interface UsePaginationOptions {
  page?: number;
  limit?: number;
  total?: number;
}

// تصدير النوع العام للكائنات المجهولة
export type UnknownObject = Record<string, unknown>;
export type StringMap = Record<string, string>;
export type NumberMap = Record<string, number>;
export type BooleanMap = Record<string, boolean>;

// Helper types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};