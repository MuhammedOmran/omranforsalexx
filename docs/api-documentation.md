# توثيق API - نظام عُمران

## نظرة عامة

يوفر نظام عُمران مجموعة شاملة من APIs للتفاعل مع البيانات والعمليات. جميع APIs تستخدم تقنية localStorage المحسنة للعمل أوف لاين.

## بنية API

### التخزين الأساسي

```typescript
// نظام التخزين الرئيسي
import { storage } from '@/utils/storage';

// حفظ البيانات
storage.setItem(key: string, data: any): boolean

// استرجاع البيانات
storage.getItem<T>(key: string, defaultValue?: T): T | null

// حذف البيانات
storage.removeItem(key: string): boolean

// مسح جميع البيانات
storage.clear(): boolean
```

## APIs المبيعات

### إدارة العملاء

#### واجهة العميل
```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  totalPurchases: number;
  lastPurchase?: string;
}
```

#### عمليات العملاء

```typescript
// إضافة عميل جديد
function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer

// الحصول على جميع العملاء
function getCustomers(): Customer[]

// الحصول على عميل بالمعرف
function getCustomerById(id: string): Customer | null

// تحديث عميل
function updateCustomer(id: string, updates: Partial<Customer>): boolean

// حذف عميل
function deleteCustomer(id: string): boolean

// البحث في العملاء
function searchCustomers(query: string): Customer[]
```

### إدارة الفواتير

#### واجهة الفاتورة
```typescript
interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'check';
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
```

#### عمليات الفواتير

```typescript
// إنشاء فاتورة جديدة
function createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice

// الحصول على جميع الفواتير
function getInvoices(): Invoice[]

// الحصول على فاتورة بالمعرف
function getInvoiceById(id: string): Invoice | null

// تحديث فاتورة
function updateInvoice(id: string, updates: Partial<Invoice>): boolean

// حذف فاتورة
function deleteInvoice(id: string): boolean

// فواتير العميل
function getCustomerInvoices(customerId: string): Invoice[]

// فواتير التاريخ
function getInvoicesByDate(startDate: string, endDate: string): Invoice[]
```

## APIs المخزون

### إدارة المنتجات

#### واجهة المنتج
```typescript
interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  unit: string;
  expiryDate?: string;
  supplierId?: string;
  supplierName?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
```

#### عمليات المنتجات

```typescript
// إضافة منتج جديد
function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product

// الحصول على جميع المنتجات
function getProducts(): Product[]

// الحصول على منتج بالمعرف
function getProductById(id: string): Product | null

// الحصول على منتج بالباركود
function getProductByBarcode(barcode: string): Product | null

// تحديث منتج
function updateProduct(id: string, updates: Partial<Product>): boolean

// حذف منتج
function deleteProduct(id: string): boolean

// تحديث المخزون
function updateStock(productId: string, quantity: number, operation: 'add' | 'subtract'): boolean

// منتجات تحت الحد الأدنى
function getLowStockProducts(): Product[]

// البحث في المنتجات
function searchProducts(query: string): Product[]
```

### تتبع حركة المخزون

#### واجهة حركة المخزون
```typescript
interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference: string; // رقم الفاتورة أو المرجع
  notes?: string;
  createdAt: string;
  userId: string;
}
```

#### عمليات حركة المخزون

```typescript
// تسجيل حركة مخزون
function recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement

// الحصول على حركات المخزون
function getStockMovements(productId?: string): StockMovement[]

// حركات المخزون بالتاريخ
function getStockMovementsByDate(startDate: string, endDate: string): StockMovement[]
```

## APIs المشتريات

### إدارة الموردين

#### واجهة المورد
```typescript
interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
```

#### عمليات الموردين

```typescript
// إضافة مورد جديد
function addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier

// الحصول على جميع الموردين
function getSuppliers(): Supplier[]

// الحصول على مورد بالمعرف
function getSupplierById(id: string): Supplier | null

// تحديث مورد
function updateSupplier(id: string, updates: Partial<Supplier>): boolean

// حذف مورد
function deleteSupplier(id: string): boolean
```

### فواتير الشراء

#### واجهة فاتورة الشراء
```typescript
interface PurchaseInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}
```

## APIs الموظفين

### إدارة الموظفين

#### واجهة الموظف
```typescript
interface Employee {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  email?: string;
  address?: string;
  position: string;
  department: string;
  hireDate: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### عمليات الموظفين

```typescript
// إضافة موظف جديد
function addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee

// الحصول على جميع الموظفين
function getEmployees(): Employee[]

// الحصول على موظف بالمعرف
function getEmployeeById(id: string): Employee | null

// تحديث موظف
function updateEmployee(id: string, updates: Partial<Employee>): boolean

// حذف موظف (تعطيل)
function deactivateEmployee(id: string): boolean
```

## APIs المالية

### صندوق النقدية

#### واجهة العملية النقدية
```typescript
interface CashTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  category: string;
  reference?: string;
  createdAt: string;
  userId: string;
}
```

#### عمليات صندوق النقدية

```typescript
// إضافة عملية نقدية
function addCashTransaction(transaction: Omit<CashTransaction, 'id' | 'createdAt'>): CashTransaction

// الحصول على رصيد الصندوق
function getCashBalance(): number

// الحصول على العمليات النقدية
function getCashTransactions(startDate?: string, endDate?: string): CashTransaction[]
```

### إدارة الشيكات

#### واجهة الشيك
```typescript
interface Check {
  id: string;
  checkNumber: string;
  bank: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'cashed' | 'bounced' | 'cancelled';
  payerName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

## APIs التقارير

### تقارير المبيعات

```typescript
// تقرير المبيعات اليومي
function getDailySalesReport(date: string): {
  totalSales: number;
  totalInvoices: number;
  avgInvoiceValue: number;
  topProducts: Array<{productId: string, productName: string, quantity: number, revenue: number}>;
}

// تقرير المبيعات الشهري
function getMonthlySalesReport(year: number, month: number): {
  totalSales: number;
  totalInvoices: number;
  dailyBreakdown: Array<{date: string, sales: number, invoices: number}>;
  topCustomers: Array<{customerId: string, customerName: string, totalPurchases: number}>;
}
```

### تقارير المخزون

```typescript
// تقرير المخزون الحالي
function getCurrentStockReport(): Array<{
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  stockValue: number;
  status: 'good' | 'low' | 'out';
}>

// تقرير حركة المخزون
function getStockMovementReport(startDate: string, endDate: string): Array<{
  productId: string;
  productName: string;
  openingStock: number;
  purchases: number;
  sales: number;
  adjustments: number;
  closingStock: number;
}>
```

## مزامنة البيانات

### نظام المزامنة التلقائية

```typescript
// تفعيل المزامنة التلقائية
function enableAutoSync(options: {
  interval: number; // بالثواني
  syncOnVisibilityChange: boolean;
  syncOnNetworkReconnect: boolean;
}): void

// مزامنة يدوية
function manualSync(): Promise<{
  success: boolean;
  itemsUpdated: number;
  error?: string;
}>

// حالة المزامنة
function getSyncStatus(): {
  lastSync: number;
  isOnline: boolean;
  syncInProgress: boolean;
}
```

## معالجة الأخطاء

### أنواع الأخطاء

```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// أكواد الأخطاء الشائعة
enum ErrorCodes {
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  STORAGE_FULL = 'STORAGE_FULL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}
```

### معالجة الأخطاء

```typescript
try {
  const result = await someAPICall();
  // معالجة النتيجة
} catch (error) {
  if (error.code === ErrorCodes.STORAGE_FULL) {
    // معالجة امتلاء التخزين
    showStorageFullWarning();
  } else if (error.code === ErrorCodes.NOT_FOUND) {
    // معالجة عدم وجود البيانات
    showNotFoundMessage();
  }
}
```

## أمثلة عملية

### مثال: إنشاء فاتورة مبيعات كاملة

```typescript
async function createFullSalesInvoice() {
  try {
    // 1. إنشاء عميل جديد (إذا لم يكن موجود)
    const customer = addCustomer({
      name: "أحمد محمد",
      phone: "0501234567",
      email: "ahmed@example.com"
    });

    // 2. الحصول على المنتجات
    const product1 = getProductByBarcode("123456789");
    const product2 = getProductByBarcode("987654321");

    if (!product1 || !product2) {
      throw new Error("بعض المنتجات غير موجودة");
    }

    // 3. إنشاء الفاتورة
    const invoice = createInvoice({
      customerId: customer.id,
      customerName: customer.name,
      items: [
        {
          productId: product1.id,
          productName: product1.name,
          quantity: 2,
          unitPrice: product1.sellingPrice,
          total: 2 * product1.sellingPrice
        },
        {
          productId: product2.id,
          productName: product2.name,
          quantity: 1,
          unitPrice: product2.sellingPrice,
          total: product2.sellingPrice
        }
      ],
      subtotal: (2 * product1.sellingPrice) + product2.sellingPrice,
      tax: 0,
      discount: 0,
      total: (2 * product1.sellingPrice) + product2.sellingPrice,
      paymentMethod: 'cash',
      status: 'paid'
    });

    // 4. تحديث المخزون
    updateStock(product1.id, 2, 'subtract');
    updateStock(product2.id, 1, 'subtract');

    // 5. تسجيل حركة المخزون
    recordStockMovement({
      productId: product1.id,
      productName: product1.name,
      type: 'out',
      quantity: 2,
      previousStock: product1.currentStock,
      newStock: product1.currentStock - 2,
      reference: invoice.id,
      userId: getCurrentUserId()
    });

    console.log('تم إنشاء الفاتورة بنجاح:', invoice.id);
    return invoice;

  } catch (error) {
    console.error('خطأ في إنشاء الفاتورة:', error);
    throw error;
  }
}
```

### مثال: تقرير شامل للمبيعات

```typescript
function generateComprehensiveSalesReport(startDate: string, endDate: string) {
  const invoices = getInvoicesByDate(startDate, endDate);
  
  const report = {
    period: { startDate, endDate },
    summary: {
      totalInvoices: invoices.length,
      totalSales: invoices.reduce((sum, inv) => sum + inv.total, 0),
      avgInvoiceValue: invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0
    },
    dailyBreakdown: generateDailyBreakdown(invoices),
    topProducts: generateTopProductsReport(invoices),
    topCustomers: generateTopCustomersReport(invoices),
    paymentMethods: generatePaymentMethodsReport(invoices)
  };

  return report;
}

function generateDailyBreakdown(invoices: Invoice[]) {
  const dailyData = new Map();
  
  invoices.forEach(invoice => {
    const date = invoice.createdAt.split('T')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, { sales: 0, invoices: 0 });
    }
    
    const dayData = dailyData.get(date);
    dayData.sales += invoice.total;
    dayData.invoices += 1;
  });

  return Array.from(dailyData.entries()).map(([date, data]) => ({
    date,
    ...data
  }));
}
```

## الأمان والتشفير

### حماية البيانات

```typescript
// تشفير البيانات الحساسة قبل التخزين
function encryptSensitiveData(data: any): string {
  // تطبيق تشفير AES
  return btoa(JSON.stringify(data)); // مثال مبسط
}

// فك تشفير البيانات
function decryptSensitiveData(encryptedData: string): any {
  try {
    return JSON.parse(atob(encryptedData));
  } catch {
    return null;
  }
}
```

### التحقق من الصلاحيات

```typescript
enum UserRole {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  USER = 'user'
}

function checkPermission(action: string, userRole: UserRole): boolean {
  const permissions = {
    [UserRole.ADMIN]: ['*'], // جميع الصلاحيات
    [UserRole.ACCOUNTANT]: ['read:reports', 'write:invoices', 'read:customers'],
    [UserRole.USER]: ['read:products', 'write:sales']
  };

  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
}
```

---

**هذا التوثيق يغطي جميع APIs المتاحة في نظام عُمران. للحصول على مساعدة إضافية أو الإبلاغ عن مشاكل في API، يرجى التواصل مع فريق التطوير.**

*تاريخ آخر تحديث: [التاريخ الحالي]*