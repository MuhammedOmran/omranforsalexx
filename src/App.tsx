import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { InvestorProvider } from "@/contexts/InvestorContext";
import { ModularAppProvider } from "@/core/ModularAppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { AppIntegrationProvider } from "@/contexts/AppIntegrationContext";
import { LocalAccountsProvider } from "@/contexts/LocalAccountsContext";
import { InvoiceSettingsProvider } from "@/contexts/InvoiceSettingsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { OfflineAutoSync } from "@/components/offline/OfflineAutoSync";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SimpleErrorBoundary } from "@/components/ui/error-boundary/SimpleErrorBoundary";
import { SEOManager } from "@/components/SEO/SEOManager";
import { PWAInstaller } from "@/components/ui/pwa-installer";
import { LazyComponentWrapper } from "@/components/performance/LazyComponentWrapper";
import { ChecksReport } from "@/components/reports/ChecksReport";
import { DeveloperTools } from "@/components/developer/DeveloperTools";

// Initialize chunk load error handler
import "@/utils/chunkLoadErrorHandler";

// الصفحات الأساسية (بدون lazy loading لتجنب مشاكل الهوك)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// استخدام النظام المحسن للـ Code Splitting
import { 
  SalesBundle, 
  InventoryBundle, 
  PurchasesBundle, 
  ReportsBundle, 
  preloadCriticalRoutes 
} from "./components/performance/CodeSplitting";

// Lazy load الصفحات الأخرى
const CashRegister = lazy(() => import("./components/cash/CashRegisterSupabase"));

const Installments = lazy(() => import("./pages/Installments"));
const Settings = lazy(() => import("./pages/Settings"));
const CurrencyConverter = lazy(() => import("./pages/CurrencyConverter"));
const Checks = lazy(() => import("./pages/Checks"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Documentation = lazy(() => import("./pages/Documentation"));
const LicenseManagement = lazy(() => import("./pages/LicenseManagement"));
const Help = lazy(() => import("./pages/Help"));
const OfflineManagement = lazy(() => import("./pages/OfflineManagement"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const Returns = lazy(() => import("./pages/Returns"));
const SystemIntegration = lazy(() => import("./pages/investors/SystemIntegration"));
const SecureInventoryDashboard = lazy(() => import("./components/inventory/SecureInventoryDashboard"));
const ComprehensiveSecurity = lazy(() => import("./pages/ComprehensiveSecurity"));
const ProductDisplay = lazy(() => import("./pages/ProductDisplay"));
const SharedProducts = lazy(() => import("./pages/SharedProducts"));
const SharedInvoice = lazy(() => import("./pages/SharedInvoice"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const ElectronTest = lazy(() => import("./pages/ElectronTest"));
const ProductionReadinessDashboard = lazy(() => import("./components/admin/ProductionReadinessDashboard").then(module => ({ default: module.ProductionReadinessDashboard })));

const CodeCleanupDashboard = lazy(() => import("./components/admin/CodeCleanupDashboard"));


// تحميل مسبق محسن ومتدرج للصفحات المهمة
setTimeout(() => {
  preloadCriticalRoutes();
}, 1000);

// تكوين QueryClient محسن للأداء
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      gcTime: 10 * 60 * 1000, // 10 دقائق
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
    </div>
  </div>
);

const SimpleLoadingFallback = () => (
  <div className="p-4 flex items-center justify-center">
    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
    <span className="mr-2 text-sm">جاري التحميل...</span>
  </div>
);

function App() {
  return (
    <SimpleErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <SupabaseAuthProvider>
                <AuthProvider>
                  <LocalAccountsProvider>
                    <ModularAppProvider>
                      <AppIntegrationProvider>
                        <CustomerProvider>
                          <InvestorProvider>
                      <InvoiceSettingsProvider>
                        <BrowserRouter>
                        <SEOManager />
                        <Toaster />
                        <Sonner />
                        <OfflineIndicator />
                        <OfflineAutoSync />
                        <PWAInstaller />
                        <DeveloperTools />
                        
                        <Suspense fallback={<LoadingFallback />}>
                          <Routes>
                            <Route path="/auth" element={
                              <Suspense fallback={<SimpleLoadingFallback />}>
                                <Auth />
                              </Suspense>
                            } />
                            <Route path="/login" element={<Navigate to="/auth" replace />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={
                              <Suspense fallback={<SimpleLoadingFallback />}>
                                <ForgotPassword />
                              </Suspense>
                            } />
                            <Route path="/reset-password" element={
                              <Suspense fallback={<SimpleLoadingFallback />}>
                                <ResetPassword />
                              </Suspense>
                            } />
                            <Route path="/" element={
                              <ProtectedRoute>
                                <Index />
                              </ProtectedRoute>
                            } />
                            
                            {/* Sales routes */}
                            <Route path="/sales/invoices" element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <Suspense fallback={<SimpleLoadingFallback />}>
                                    <SalesBundle.Invoices />
                                  </Suspense>
                                </AppLayout>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/invoices/new" element={
                              <ProtectedRoute>
                                <Suspense fallback={<SimpleLoadingFallback />}>
                                  <SalesBundle.NewInvoice />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/invoices/restore" element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <Suspense fallback={<SimpleLoadingFallback />}>
                                    <SalesBundle.RestoreInvoices />
                                  </Suspense>
                                </AppLayout>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/customers" element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <Suspense fallback={<SimpleLoadingFallback />}>
                                    <SalesBundle.Customers />
                                  </Suspense>
                                </AppLayout>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/customers/new" element={
                              <ProtectedRoute>
                                <Suspense fallback={<SimpleLoadingFallback />}>
                                  <SalesBundle.NewCustomer />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/customers/restore" element={
                              <ProtectedRoute>
                                <Suspense fallback={<SimpleLoadingFallback />}>
                                  <SalesBundle.RestoreCustomers />
                                </Suspense>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/customers/view/:id" element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <Suspense fallback={<SimpleLoadingFallback />}>
                                    <SalesBundle.ViewCustomer />
                                  </Suspense>
                                </AppLayout>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/customers/edit/:id" element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <Suspense fallback={<SimpleLoadingFallback />}>
                                    <SalesBundle.EditCustomer />
                                  </Suspense>
                                </AppLayout>
                              </ProtectedRoute>
                            } />
                            <Route path="/sales/dashboard" element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <Suspense fallback={<SimpleLoadingFallback />}>
                                    <SalesBundle.Dashboard />
                                  </Suspense>
                                </AppLayout>
                              </ProtectedRoute>
                            } />
                            
                            
                            
                            {/* Other routes */}
                            <Route path="/purchases/invoices" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><PurchasesBundle.Invoices /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/purchases/invoices/new" element={<ProtectedRoute><Suspense fallback={<SimpleLoadingFallback />}><PurchasesBundle.NewPurchase /></Suspense></ProtectedRoute>} />
                            <Route path="/purchases/suppliers" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><PurchasesBundle.Suppliers /></Suspense></AppLayout></ProtectedRoute>} />
                            
                            <Route path="/inventory/products" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><InventoryBundle.Products /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/inventory/products/new" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><InventoryBundle.NewProduct /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/inventory/stock" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><InventoryBundle.Stock /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/inventory/barcode" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><InventoryBundle.Barcode /></Suspense></AppLayout></ProtectedRoute>} />
                            
                             <Route path="/cash-register" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><CashRegister /></Suspense></AppLayout></ProtectedRoute>} />
                             
                             
                             <Route path="/installments" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><Installments /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/currency-converter" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><CurrencyConverter /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/checks" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><Checks /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/returns" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><Returns /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/product-display" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ProductDisplay /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/shared-products/:shareId" element={<Suspense fallback={<SimpleLoadingFallback />}><SharedProducts /></Suspense>} />
                            <Route path="/shared-invoice/:shareId" element={<Suspense fallback={<SimpleLoadingFallback />}><SharedInvoice /></Suspense>} />
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            <Route path="/settings" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><Settings /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/documentation" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><Documentation /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/offline-management" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><OfflineManagement /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/license-management" element={<ProtectedRoute><Suspense fallback={<SimpleLoadingFallback />}><LicenseManagement /></Suspense></ProtectedRoute>} />
                            
                            <Route path="/monitoring" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><MonitoringPage /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/system-health" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><SystemHealth /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/system-integration" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><SystemIntegration /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/secure-inventory" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><SecureInventoryDashboard /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/comprehensive-security" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ComprehensiveSecurity /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/production-readiness" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><LazyComponentWrapper><ProductionReadinessDashboard /></LazyComponentWrapper></Suspense></AppLayout></ProtectedRoute>} />
                            
                            <Route path="/reports/profit" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ReportsBundle.Profit /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/reports/sales" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ReportsBundle.Sales /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/reports/purchases" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ReportsBundle.Purchases /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/reports/inventory" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ReportsBundle.Inventory /></Suspense></AppLayout></ProtectedRoute>} />
                            <Route path="/reports/checks" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><LazyComponentWrapper><ChecksReport /></LazyComponentWrapper></Suspense></AppLayout></ProtectedRoute>} />
                            
                            <Route path="/help" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><Help /></Suspense></AppLayout></ProtectedRoute>} />
                            
                            {/* صفحة اختبار Electron */}
                            <Route path="/electron-test" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><ElectronTest /></Suspense></AppLayout></ProtectedRoute>} />
                            
                            {/* صفحة تنظيف الكود */}
                            <Route path="/code-cleanup" element={<ProtectedRoute><AppLayout><Suspense fallback={<SimpleLoadingFallback />}><CodeCleanupDashboard /></Suspense></AppLayout></ProtectedRoute>} />
                            
                            
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                        </BrowserRouter>
                      </InvoiceSettingsProvider>
                          </InvestorProvider>
                        </CustomerProvider>
                      </AppIntegrationProvider>
                    </ModularAppProvider>
                  </LocalAccountsProvider>
                </AuthProvider>
              </SupabaseAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SimpleErrorBoundary>
  );
}

export default App;
