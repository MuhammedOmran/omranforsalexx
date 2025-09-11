import { lazy, ComponentType } from 'react';
import { LazyComponentWrapper } from './LazyComponentWrapper';

// Cache للمكونات المحملة
const componentCache = new Map<string, ComponentType<any>>();

// تحسين Code Splitting مع preloading ذكي
const createLazyComponent = (
  factory: () => Promise<{ default: ComponentType<any> }>,
  preload = false,
  cacheKey?: string
) => {
  // التحقق من الـ cache أولاً
  if (cacheKey && componentCache.has(cacheKey)) {
    const CachedComponent = componentCache.get(cacheKey)!;
    return (props: any) => <CachedComponent {...props} />;
  }

  const LazyComponent = lazy(async () => {
    const module = await factory();
    // حفظ في الـ cache
    if (cacheKey) {
      componentCache.set(cacheKey, module.default);
    }
    return module;
  });
  
  // Preload the component if needed
  if (preload) {
    // تحميل مسبق فوري للمكونات المهمة
    requestIdleCallback(() => factory());
  }
  
  // Return wrapped component مع تحسينات
  return (props: any) => (
    <LazyComponentWrapper minLoadingTime={25}>
      <LazyComponent {...props} />
    </LazyComponentWrapper>
  );
};

// تجميع الصفحات المترابطة في chunks منطقية مع cache
export const SalesBundle = {
  Invoices: createLazyComponent(() => import("@/pages/sales/Invoices"), true, 'sales-invoices'),
  NewInvoice: createLazyComponent(() => import("@/pages/sales/NewInvoice"), false, 'sales-new-invoice'),
  RestoreInvoices: createLazyComponent(() => import("@/pages/sales/RestoreInvoices"), false, 'sales-restore-invoices'),
  Customers: createLazyComponent(() => import("@/pages/sales/Customers"), true, 'sales-customers'),
  NewCustomer: createLazyComponent(() => import("@/pages/sales/NewCustomer"), false, 'sales-new-customer'),
  RestoreCustomers: createLazyComponent(() => import("@/pages/sales/RestoreCustomers"), false, 'sales-restore-customers'),
  ViewCustomer: createLazyComponent(() => import("@/pages/sales/ViewCustomer"), false, 'sales-view-customer'),
  EditCustomer: createLazyComponent(() => import("@/pages/sales/EditCustomer"), false, 'sales-edit-customer'),
  Reports: createLazyComponent(() => import("@/pages/sales/Reports"), false, 'sales-reports'),
  Dashboard: createLazyComponent(() => import("@/pages/sales/Dashboard"), true, 'sales-dashboard'),
};

export const InventoryBundle = {
  Products: createLazyComponent(() => import("@/pages/inventory/Products"), true, 'inventory-products'),
  NewProduct: createLazyComponent(() => import("@/pages/inventory/NewProduct"), false, 'inventory-new-product'),
  Stock: createLazyComponent(() => import("@/pages/inventory/CurrentStock"), false, 'inventory-stock'),
  Barcode: createLazyComponent(() => import("@/pages/inventory/Barcode"), false, 'inventory-barcode'),
};

export const PurchasesBundle = {
  Invoices: createLazyComponent(() => import("@/pages/purchases/Invoices")),
  NewPurchase: createLazyComponent(() => import("@/pages/purchases/NewPurchase")),
  Suppliers: createLazyComponent(() => import("@/pages/purchases/Suppliers")),
};

export const ReportsBundle = {
  Sales: createLazyComponent(() => import("@/pages/reports/Sales")),
  Purchases: createLazyComponent(() => import("@/pages/reports/Purchases")),
  Inventory: createLazyComponent(() => import("@/pages/reports/Inventory")),
  Profit: createLazyComponent(() => import("@/pages/reports/Profit")),
};


// تحميل مسبق محسن ومتدرج للصفحات الأساسية
export const preloadCriticalRoutes = () => {
  // تحميل مسبق فوري للصفحات الأكثر استخداماً (اثنين فقط)
  requestIdleCallback(() => {
    import("@/pages/sales/Invoices");
  });
  
  // تحميل مسبق متدرج بعد 3 ثواني
  setTimeout(() => {
    requestIdleCallback(() => {
      import("@/pages/inventory/Products");
    });
  }, 3000);
  
  // تحميل مسبق للصفحات الثانوية بعد 8 ثواني
  setTimeout(() => {
    requestIdleCallback(() => {
      import("@/pages/sales/Customers");
      import("@/pages/CashRegister");
    });
  }, 8000);
  
  // تحميل مسبق للتقارير والإعدادات بعد 15 ثانية (إذا كان المستخدم لا يزال نشطاً)
  setTimeout(() => {
    if (document.hasFocus()) {
      requestIdleCallback(() => {
        import("@/pages/reports/Sales");
        import("@/pages/Settings");
      });
    }
  }, 15000);
};