import { SystemStatusMonitor } from "@/components/ui/system-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Database,
  Users,
  FileText,
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";

interface HealthMetrics {
  totalUsers: number;
  totalInvoices: number;
  totalProducts: number;
  systemUptime: string;
  memoryUsage: number;
  errors: string[];
  warnings: string[];
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    totalUsers: 0,
    totalInvoices: 0,
    totalProducts: 0,
    systemUptime: "0 ساعة",
    memoryUsage: 45,
    errors: [],
    warnings: []
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadSystemMetrics = () => {
    setIsLoading(true);
    try {
      // جمع البيانات من التخزين المحلي
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
      const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
      const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
      const products = JSON.parse(localStorage.getItem('products') || '[]');

      const errors: string[] = [];
      const warnings: string[] = [];

      // فحص الأخطاء والتحذيرات
      if (products.length === 0) warnings.push("لا توجد منتجات مسجلة في النظام");
      if (customers.length === 0) warnings.push("لا يوجد عملاء مسجلين في النظام");
      if (salesInvoices.length === 0) warnings.push("لا توجد فواتير مبيعات");

      // حساب مدة تشغيل النظام
      const startTime = localStorage.getItem('app_start_time');
      let uptime = "غير محدد";
      if (startTime) {
        const hours = Math.floor((Date.now() - parseInt(startTime)) / (1000 * 60 * 60));
        uptime = `${hours} ساعة`;
      }

      setMetrics({
        totalUsers: customers.length + suppliers.length,
        totalInvoices: salesInvoices.length + purchaseInvoices.length,
        totalProducts: products.length,
        systemUptime: uptime,
        memoryUsage: Math.floor(Math.random() * 30) + 40, // محاكاة استخدام الذاكرة
        errors,
        warnings
      });
    } catch (error) {
      console.error('خطأ في تحميل مقاييس النظام:', error);
      setMetrics(prev => ({
        ...prev,
        errors: ['خطأ في تحميل بيانات النظام']
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // تعيين وقت بدء التطبيق إذا لم يكن موجوداً
    if (!localStorage.getItem('app_start_time')) {
      localStorage.setItem('app_start_time', Date.now().toString());
    }

    loadSystemMetrics();
    
    // تحديث دوري كل دقيقة
    const interval = setInterval(loadSystemMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const getHealthStatus = () => {
    if (metrics.errors.length > 0) return { status: 'error', label: 'غير صحي', color: 'text-red-600' };
    if (metrics.warnings.length > 0) return { status: 'warning', label: 'تحذيرات', color: 'text-yellow-600' };
    return { status: 'healthy', label: 'صحي', color: 'text-green-600' };
  };

  const health = getHealthStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">جاري تحميل حالة النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          صحة النظام
        </h1>
        <Button onClick={loadSystemMetrics} variant="outline">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث البيانات
        </Button>
      </div>

      {/* الحالة العامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className={`h-5 w-5 ${health.color}`} />
            الحالة العامة للنظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge 
              variant={health.status === 'error' ? 'destructive' : health.status === 'warning' ? 'secondary' : 'default'}
              className="px-3 py-1"
            >
              {health.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              آخر فحص: {new Date().toLocaleTimeString('ar-SA')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* مراقب حالة النظام */}
      <SystemStatusMonitor />

      {/* مقاييس النظام */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">عملاء وموردين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">مبيعات ومشتريات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">في المخزون</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استخدام الذاكرة</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memoryUsage}%</div>
            <p className="text-xs text-muted-foreground">من الذاكرة المتاحة</p>
          </CardContent>
        </Card>
      </div>

      {/* الأخطاء والتحذيرات */}
      {metrics.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              أخطاء النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {metrics.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              تحذيرات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.warnings.map((warning, index) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>تحذير</AlertTitle>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm font-medium">مدة تشغيل النظام:</span>
              <p className="text-sm text-muted-foreground">{metrics.systemUptime}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">إصدار التطبيق:</span>
              <p className="text-sm text-muted-foreground">v1.0.0</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">نوع المتصفح:</span>
              <p className="text-sm text-muted-foreground">{navigator.userAgent.split(' ')[0]}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium">حالة الاتصال:</span>
              <p className="text-sm text-muted-foreground">
                {navigator.onLine ? 'متصل بالإنترنت' : 'غير متصل'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}