import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { reportDataGenerator } from '@/utils/reportDataGenerator';
import { Link } from 'react-router-dom';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { CompanyHeader } from '@/components/ui/company-header';

interface SalesDashboardData {
  todaySales: number;
  monthlySales: number;
  totalCustomers: number;
  pendingOrders: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    customer: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'cancelled';
  }>;
  monthlyTargets: {
    current: number;
    target: number;
    percentage: number;
  };
}

export default function SalesDashboard() {
  const [dashboardData, setDashboardData] = useState<SalesDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { formatCurrency, companyInfo } = useCompanySettings();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // حساب مبيعات اليوم
      const today = new Date().toISOString().split('T')[0];
      // استخدام المفتاح الصحيح لفواتير البيع
      const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
      const todayInvoices = salesInvoices.filter((inv: any) => 
        new Date(inv.date).toISOString().split('T')[0] === today
      );
      const todaySales = todayInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      
      // حساب مبيعات الشهر الحالي فقط من البيانات الفعلية
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyInvoices = salesInvoices.filter((inv: any) => {
        const invoiceDate = new Date(inv.date);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      });
      const monthlySales = monthlyInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      
      // حساب إجمالي العملاء من البيانات الفعلية - استخدام المفتاح الصحيح
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // حساب الطلبات المعلقة من فواتير البيع
      const pendingOrders = salesInvoices.filter((inv: any) => 
        inv.status === 'pending' || inv.status === 'معلقة' || inv.paymentStatus === 'pending'
      ).length;
      
      // حساب أفضل المنتجات من البيانات الفعلية فقط
      const topProducts = salesInvoices.length > 0 ? reportDataGenerator.getSalesReportData().topProducts || [] : [];
      
      const dashboardData: SalesDashboardData = {
        todaySales,
        monthlySales, // مبيعات الشهر من فواتير البيع الفعلية
        totalCustomers: customers.length, // إجمالي العملاء من قاعدة بيانات العملاء
        pendingOrders, // الطلبات المعلقة من فواتير البيع
        topProducts: topProducts.map((product: any) => ({
          name: product.name,
          sales: product.quantity || 0,
          revenue: product.revenue || 0
        })),
        recentTransactions: [],
        monthlyTargets: {
          current: monthlySales, // استخدام المبيعات الفعلية
          target: 0,
          percentage: 0
        }
      };
      
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات لوحة المبيعات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'pending': return 'قيد الانتظار';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="p-6 space-y-6">
      {/* رأس الشركة */}
      <CompanyHeader variant="minimal" />
      
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold">لوحة المبيعات</h1>
        <p className="text-muted-foreground">مراقبة أداء المبيعات والعملاء</p>
      </div>

      {/* البطاقات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مبيعات اليوم</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardData.todaySales)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  مبيعات اليوم الحالي
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مبيعات الشهر</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardData.monthlySales)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  مبيعات الشهر الحالي
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي العملاء</p>
                <p className="text-2xl font-bold">{dashboardData.totalCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  إجمالي العملاء المسجلين
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">طلبات معلقة</p>
                <p className="text-2xl font-bold">{dashboardData.pendingOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  الطلبات المعلقة
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* هدف المبيعات الشهري */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            هدف المبيعات الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">لم يتم تحديد هدف للمبيعات بعد</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                const targetCurrency = companyInfo.currency === 'SAR' ? 'بالريال' : 
                                  companyInfo.currency === 'EGP' ? 'بالجنيه' : 
                                  companyInfo.currency === 'AED' ? 'بالدرهم' : 
                                  `بعملة ${companyInfo.currency}`;
                const target = prompt(`أدخل هدف المبيعات الشهري ${targetCurrency}:`);
                if (target && !isNaN(Number(target))) {
                  localStorage.setItem('monthlyTarget', target);
                  window.location.reload();
                }
              }}
            >
              تحديد هدف المبيعات
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أفضل المنتجات */}
        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">لا توجد بيانات مبيعات متاحة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} وحدة مباعة</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* المعاملات الأخيرة */}
        <Card>
          <CardHeader>
            <CardTitle>المعاملات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد معاملات حديثة</p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" asChild className="w-full">
                <Link to="/sales/invoices">عرض جميع الفواتير</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}