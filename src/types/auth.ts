// أنواع البيانات للمصادقة والصلاحيات

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions: Permission[];
  avatar?: string;
  department?: string;
}

export interface UserRole {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  level: number; // مستوى الأولوية: 1 = أعلى صلاحية
  permissions: string[];
  isSystem: boolean; // الأدوار النظام لا يمكن حذفها
}

export interface Permission {
  id: string;
  name: string;
  nameAr: string;
  module: string; // المودول المرتبط به
  action: PermissionAction;
  description: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve' | 'execute';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: { username: string; email: string; password: string; phone?: string }) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccess: (module: string, action: PermissionAction) => boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
}

// الأدوار الافتراضية للنظام
export const DefaultRoles: UserRole[] = [
  {
    id: 'super-admin',
    name: 'super-admin',
    nameAr: 'مدير النظام',
    description: 'صلاحيات كاملة على النظام',
    level: 1,
    permissions: ['*'], // صلاحية على كل شيء
    isSystem: true
  },
  {
    id: 'developer',
    name: 'developer',
    nameAr: 'مطور',
    description: 'صلاحيات المطور للوصول إلى أدوات التطوير والتراخيص',
    level: 1,
    permissions: ['*'], // صلاحية على كل شيء
    isSystem: true
  },
  {
    id: 'admin',
    name: 'admin',
    nameAr: 'مدير',
    description: 'صلاحيات إدارية شاملة',
    level: 2,
    permissions: [
      'sales.*',
      'purchases.*',
      'inventory.*',
      'reports.*',
      'users.read',
      'users.update',
      'settings.update',
      'cash-register.*',
      'expenses.*'
    ],
    isSystem: true
  },
  {
    id: 'accountant',
    name: 'accountant',
    nameAr: 'محاسب',
    description: 'صلاحيات محاسبية',
    level: 3,
    permissions: [
      'sales.read',
      'sales.create',
      'sales.update',
      'purchases.read',
      'purchases.create',
      'purchases.update',
      'inventory.read',
      'reports.*',
      'cash-register.*',
      'expenses.*',
      'checks.*'
    ],
    isSystem: true
  },
  {
    id: 'sales-manager',
    name: 'sales-manager',
    nameAr: 'مدير المبيعات',
    description: 'إدارة المبيعات والعملاء',
    level: 4,
    permissions: [
      'sales.*',
      'inventory.read',
      'reports.sales',
      'cash-register.read',
      'customers.*'
    ],
    isSystem: true
  },
  {
    id: 'sales-employee',
    name: 'sales-employee',
    nameAr: 'موظف مبيعات',
    description: 'إدخال فواتير المبيعات',
    level: 5,
    permissions: [
      'sales.create',
      'sales.read',
      'sales.update',
      'inventory.read',
      'customers.read',
      'customers.create',
      'cash-register.read'
    ],
    isSystem: true
  },
  {
    id: 'warehouse-manager',
    name: 'warehouse-manager',
    nameAr: 'مدير المخزون',
    description: 'إدارة المخزون والمشتريات',
    level: 4,
    permissions: [
      'inventory.*',
      'purchases.*',
      'suppliers.*',
      'reports.inventory',
      'reports.purchases'
    ],
    isSystem: true
  },
  {
    id: 'viewer',
    name: 'viewer',
    nameAr: 'مستعرض',
    description: 'صلاحيات عرض فقط',
    level: 6,
    permissions: [
      'sales.read',
      'purchases.read',
      'inventory.read',
      'reports.read'
    ],
    isSystem: true
  }
];

// الصلاحيات الافتراضية
export const DefaultPermissions: Permission[] = [
  // المبيعات
  { id: 'sales.create', name: 'sales.create', nameAr: 'إنشاء فاتورة مبيعات', module: 'sales', action: 'create', description: 'إنشاء فواتير مبيعات جديدة' },
  { id: 'sales.read', name: 'sales.read', nameAr: 'عرض المبيعات', module: 'sales', action: 'read', description: 'عرض فواتير المبيعات' },
  { id: 'sales.update', name: 'sales.update', nameAr: 'تعديل المبيعات', module: 'sales', action: 'update', description: 'تعديل فواتير المبيعات' },
  { id: 'sales.delete', name: 'sales.delete', nameAr: 'حذف المبيعات', module: 'sales', action: 'delete', description: 'حذف فواتير المبيعات' },
  
  // المشتريات
  { id: 'purchases.create', name: 'purchases.create', nameAr: 'إنشاء فاتورة مشتريات', module: 'purchases', action: 'create', description: 'إنشاء فواتير مشتريات جديدة' },
  { id: 'purchases.read', name: 'purchases.read', nameAr: 'عرض المشتريات', module: 'purchases', action: 'read', description: 'عرض فواتير المشتريات' },
  { id: 'purchases.update', name: 'purchases.update', nameAr: 'تعديل المشتريات', module: 'purchases', action: 'update', description: 'تعديل فواتير المشتريات' },
  { id: 'purchases.delete', name: 'purchases.delete', nameAr: 'حذف المشتريات', module: 'purchases', action: 'delete', description: 'حذف فواتير المشتريات' },
  
  // المخزون
  { id: 'inventory.create', name: 'inventory.create', nameAr: 'إضافة منتج', module: 'inventory', action: 'create', description: 'إضافة منتجات جديدة' },
  { id: 'inventory.read', name: 'inventory.read', nameAr: 'عرض المخزون', module: 'inventory', action: 'read', description: 'عرض المنتجات والمخزون' },
  { id: 'inventory.update', name: 'inventory.update', nameAr: 'تعديل المخزون', module: 'inventory', action: 'update', description: 'تعديل المنتجات والكميات' },
  { id: 'inventory.delete', name: 'inventory.delete', nameAr: 'حذف المنتج', module: 'inventory', action: 'delete', description: 'حذف المنتجات' },
  
  // التقارير
  { id: 'reports.read', name: 'reports.read', nameAr: 'عرض التقارير', module: 'reports', action: 'read', description: 'عرض جميع التقارير' },
  { id: 'reports.export', name: 'reports.export', nameAr: 'تصدير التقارير', module: 'reports', action: 'export', description: 'تصدير البيانات والتقارير' },
  
  // العملاء
  { id: 'customers.create', name: 'customers.create', nameAr: 'إضافة عميل', module: 'customers', action: 'create', description: 'إضافة عملاء جدد' },
  { id: 'customers.read', name: 'customers.read', nameAr: 'عرض العملاء', module: 'customers', action: 'read', description: 'عرض قائمة العملاء' },
  { id: 'customers.update', name: 'customers.update', nameAr: 'تعديل العميل', module: 'customers', action: 'update', description: 'تعديل بيانات العملاء' },
  { id: 'customers.delete', name: 'customers.delete', nameAr: 'حذف العميل', module: 'customers', action: 'delete', description: 'حذف العملاء' },
  
  // الموردين
  { id: 'suppliers.create', name: 'suppliers.create', nameAr: 'إضافة مورد', module: 'suppliers', action: 'create', description: 'إضافة موردين جدد' },
  { id: 'suppliers.read', name: 'suppliers.read', nameAr: 'عرض الموردين', module: 'suppliers', action: 'read', description: 'عرض قائمة الموردين' },
  { id: 'suppliers.update', name: 'suppliers.update', nameAr: 'تعديل المورد', module: 'suppliers', action: 'update', description: 'تعديل بيانات الموردين' },
  { id: 'suppliers.delete', name: 'suppliers.delete', nameAr: 'حذف المورد', module: 'suppliers', action: 'delete', description: 'حذف الموردين' },
  
  // المستخدمين
  { id: 'users.create', name: 'users.create', nameAr: 'إضافة مستخدم', module: 'users', action: 'create', description: 'إضافة مستخدمين جدد' },
  { id: 'users.read', name: 'users.read', nameAr: 'عرض المستخدمين', module: 'users', action: 'read', description: 'عرض قائمة المستخدمين' },
  { id: 'users.update', name: 'users.update', nameAr: 'تعديل المستخدم', module: 'users', action: 'update', description: 'تعديل بيانات المستخدمين' },
  { id: 'users.delete', name: 'users.delete', nameAr: 'حذف المستخدم', module: 'users', action: 'delete', description: 'حذف المستخدمين' },
  
  // الصندوق
  { id: 'cash-register.read', name: 'cash-register.read', nameAr: 'عرض الصندوق', module: 'cash-register', action: 'read', description: 'عرض حالة الصندوق' },
  { id: 'cash-register.update', name: 'cash-register.update', nameAr: 'تعديل الصندوق', module: 'cash-register', action: 'update', description: 'إجراء عمليات الصندوق' },
  
  // المصروفات
  { id: 'expenses.create', name: 'expenses.create', nameAr: 'إضافة مصروف', module: 'expenses', action: 'create', description: 'إضافة مصروفات جديدة' },
  { id: 'expenses.read', name: 'expenses.read', nameAr: 'عرض المصروفات', module: 'expenses', action: 'read', description: 'عرض المصروفات' },
  { id: 'expenses.update', name: 'expenses.update', nameAr: 'تعديل المصروف', module: 'expenses', action: 'update', description: 'تعديل المصروفات' },
  { id: 'expenses.delete', name: 'expenses.delete', nameAr: 'حذف المصروف', module: 'expenses', action: 'delete', description: 'حذف المصروفات' },
  
  // الإعدادات
  { id: 'settings.read', name: 'settings.read', nameAr: 'عرض الإعدادات', module: 'settings', action: 'read', description: 'عرض إعدادات النظام' },
  { id: 'settings.update', name: 'settings.update', nameAr: 'تعديل الإعدادات', module: 'settings', action: 'update', description: 'تعديل إعدادات النظام' },
  
  // الأمان والتدقيق
  { id: 'security.view', name: 'security.view', nameAr: 'عرض الأمان', module: 'security', action: 'read', description: 'عرض تقارير الأمان والتدقيق' },
  { id: 'security.approve', name: 'security.approve', nameAr: 'الموافقة على العمليات', module: 'security', action: 'approve', description: 'الموافقة على العمليات الحساسة' },
  { id: 'security.execute', name: 'security.execute', nameAr: 'تنفيذ العمليات الحساسة', module: 'security', action: 'execute', description: 'تنفيذ العمليات التي تحتاج صلاحيات خاصة' },
  
  // الأداء والتحسين
  { id: 'performance.view', name: 'performance.view', nameAr: 'عرض الأداء', module: 'performance', action: 'read', description: 'عرض تقارير الأداء' },
  { id: 'performance.optimize', name: 'performance.optimize', nameAr: 'تحسين الأداء', module: 'performance', action: 'execute', description: 'تشغيل أدوات تحسين الأداء' }
];