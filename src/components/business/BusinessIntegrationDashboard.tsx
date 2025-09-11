import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { businessIntegration } from "@/utils/businessIntegration";
import { logger } from '@/utils/logger';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart
} from "lucide-react";

export function BusinessIntegrationDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(businessIntegration.getBusinessAnalytics());

  const handleMigrateData = async () => {
    setIsLoading(true);
    
    try {
      const result = businessIntegration.migrateExistingData();
      
      toast({
        title: "تم ربط البيانات بنجاح",
        description: `تم معالجة ${result.salesProcessed} فاتورة مبيعات و ${result.purchasesProcessed} فاتورة شراء`,
      });
      
      if (result.errors.length > 0) {
        logger.warn('Migration errors', result.errors, 'BusinessIntegrationDashboard');
      }
      
      // Refresh analytics
      setAnalytics(businessIntegration.getBusinessAnalytics());
      
    } catch (error) {
      toast({
        title: "خطأ في ربط البيانات",
        description: "حدث خطأ أثناء ربط البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalytics = () => {
    setAnalytics(businessIntegration.getBusinessAnalytics());
    toast({
      title: "تم تحديث البيانات",
      description: "تم تحديث التحليلات بنجاح"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ربط أقسام الأعمال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            يربط هذا النظام بين أقسام المبيعات والمشتريات والمخزون لضمان تحديث البيانات تلقائياً
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleMigrateData}
              disabled={isLoading}
              variant="default"
            >
              {isLoading ? (
                <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="ml-2 h-4 w-4" />
              )}
              ربط البيانات الموجودة
            </Button>
            
            <Button 
              onClick={refreshAnalytics}
              variant="outline"
            >
              <TrendingUp className="ml-2 h-4 w-4" />
              تحديث التحليلات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              منتج في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {analytics.salesRevenue.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي المبيعات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تكلفة المشتريات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {analytics.purchaseCosts.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي المشتريات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.grossProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {analytics.grossProfit.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              هامش ربح {analytics.grossProfitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              تنبيهات المخزون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">منتجات منخفضة المخزون</span>
              <Badge variant="secondary">{analytics.lowStockAlerts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">منتجات نفدت من المخزون</span>
              <Badge variant="destructive">{analytics.outOfStockAlerts}</Badge>
            </div>
            <Progress 
              value={analytics.outOfStockAlerts === 0 ? 100 : 50} 
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              المنتجات الأكثر مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topSellingProducts.slice(0, 3).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.quantity} قطعة
                  </div>
                </div>
              ))}
              {analytics.topSellingProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  لا توجد مبيعات بعد
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            النشاط الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  {activity.type === 'in' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{activity.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.reason} - كمية: {activity.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {activity.value.toLocaleString()} ج.م
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
            ))}
            {analytics.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                لا توجد حركات حديثة
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}