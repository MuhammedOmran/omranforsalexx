import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { reportDataGenerator } from "@/utils/reportDataGenerator";
import { storage } from "@/utils/storage";
import { unifiedReportsManager } from "@/utils/unifiedReportsManager";
import { logger } from "@/utils/logger";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function KPICard({ title, value, change, changeType, icon: Icon, description }: KPICardProps) {
  return (
    <Card className="hover:shadow-custom-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center text-xs mt-1">
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
            {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
          {description && (
            <span className="text-muted-foreground mr-2">من {description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICards() {
  const [kpiData, setKpiData] = useState<Array<{
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }>>([
    {
      title: "إجمالي المبيعات اليوم",
      value: "0 ج.م",
      change: "0%",
      changeType: "neutral" as const,
      icon: DollarSign,
      description: "الأمس",
    },
    {
      title: "عدد الفواتير",
      value: "0",
      change: "0%",
      changeType: "neutral" as const,
      icon: ShoppingCart,
      description: "اليوم",
    },
    {
      title: "قيمة المخزون",
      value: "0 ج.م",
      change: "0%",
      changeType: "neutral" as const,
      icon: Package,
      description: "إجمالي",
    },
    {
      title: "العملاء الجدد",
      value: "0",
      change: "0%",
      changeType: "neutral" as const,
      icon: Users,
      description: "الشهر الحالي",
    },
    {
      title: "المنتجات منخفضة المخزون",
      value: "0",
      change: "لا توجد منتجات",
      changeType: "neutral" as const,
      icon: AlertTriangle,
      description: "تحتاج متابعة",
    },
    {
      title: "الأرباح الشهرية",
      value: "0 ج.م",
      change: "0%",
      changeType: "neutral" as const,
      icon: TrendingUp,
      description: "الشهر الحالي",
    },
  ]);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = () => {
    try {
      // بيانات المبيعات
      const salesData = reportDataGenerator.getSalesReportData();
      // بيانات المخزون
      const inventoryData = reportDataGenerator.getInventoryReportData();
      // بيانات العملاء
      const customers = storage.getItem('customers', []);

      // حساب مبيعات اليوم من فواتير اليوم مباشرة
      const today = new Date().toISOString().split('T')[0];
      const salesInvoices = storage.getItem('sales_invoices', []);
      const todayInvoicesList = salesInvoices.filter((invoice: any) =>
        new Date(invoice.date).toISOString().split('T')[0] === today
      );
      const todayInvoices = todayInvoicesList.length;
      const todaySales = todayInvoicesList.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

      // صافي الربح الشهري الحقيقي
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      const profitReport = unifiedReportsManager.getComprehensiveProfitReport(monthStart, monthEnd);
      const monthlyNetProfit = profitReport?.profitability?.netProfit || 0;

      // العملاء الجدد هذا الشهر
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const newCustomers = customers.filter((customer: any) => {
        const customerDate = new Date(customer.createdAt || customer.registrationDate || Date.now());
        return customerDate.getMonth() === currentMonth && customerDate.getFullYear() === currentYear;
      }).length;

      // قيمة المخزون الإجمالية
      const inventoryTotalValue = inventoryData.totalValue || 0;

      const updatedKpiData = [
        {
          title: "إجمالي المبيعات اليوم",
          value: `${todaySales.toLocaleString()} ج.م`,
          change: "0%",
          changeType: "neutral" as const,
          icon: DollarSign,
          description: todaySales > 0 ? "من فواتير اليوم" : "لا توجد مبيعات اليوم",
        },
        {
          title: "عدد الفواتير",
          value: `${salesInvoices.length}`,
          change: "0%",
          changeType: "neutral" as const,
          icon: ShoppingCart,
          description: todayInvoices > 0 ? `${todayInvoices} فاتورة اليوم` : "لا توجد فواتير اليوم",
        },
        {
          title: "قيمة المخزون",
          value: `${inventoryTotalValue.toLocaleString()} ج.م`,
          change: "0%",
          changeType: "neutral" as const,
          icon: Package,
          description: inventoryData.totalProducts > 0 ? `${inventoryData.totalProducts} منتج` : "لا توجد منتجات",
        },
        {
          title: "العملاء الجدد",
          value: `${newCustomers}`,
          change: "0%",
          changeType: "neutral" as const,
          icon: Users,
          description: customers.length > 0 ? `${customers.length} إجمالي العملاء` : "لا يوجد عملاء",
        },
        {
          title: "المنتجات منخفضة المخزون",
          value: `${inventoryData.lowStockItems}`,
          change: inventoryData.lowStockItems > 0 ? "تحتاج متابعة" : "الوضع جيد",
          changeType: inventoryData.lowStockItems > 0 ? "negative" as const : "neutral" as const,
          icon: AlertTriangle,
          description: "تنبيه",
        },
        {
          title: "الأرباح الشهرية",
          value: `${monthlyNetProfit.toLocaleString()} ج.م`,
          change: "0%",
          changeType: "neutral" as const,
          icon: TrendingUp,
          description: monthlyNetProfit > 0 ? "من المبيعات الفعلية" : "لا توجد أرباح هذا الشهر",
        },
      ];

      setKpiData(updatedKpiData);
    } catch (error) {
      logger.error('خطأ في تحميل بيانات KPI', error, 'KPICards');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
}