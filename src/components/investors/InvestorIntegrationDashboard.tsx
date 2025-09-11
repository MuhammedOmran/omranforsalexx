import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInvestor } from '@/contexts/InvestorContext';
import { businessIntegration } from '@/utils/businessIntegration';
import { inventoryManager } from '@/utils/inventoryUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Activity,
  Users,
  BarChart3,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InvestorIntegrationDashboard() {
  const { investors } = useInvestor();
  const { toast } = useToast();
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMigrateData = async () => {
    setIsLoading(true);
    try {
      const result = businessIntegration.migrateInvestorData();
      toast({
        title: "تم ترحيل البيانات",
        description: `تم معالجة ${result.processed} عنصر بنجاح`,
      });
      
      if (result.errors.length > 0) {
        console.error('Migration errors:', result.errors);
      }
    } catch (error) {
      toast({
        title: "خطأ في الترحيل",
        description: "حدث خطأ أثناء ترحيل البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInvestorAnalytics = (investorId: string) => {
    return businessIntegration.getInvestorAnalytics(investorId);
  };

  const selectedInvestorData = selectedInvestor 
    ? investors.find(inv => inv.id === selectedInvestor)
    : null;

  const selectedInvestorAnalytics = selectedInvestor 
    ? getInvestorAnalytics(selectedInvestor)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة المستثمرين المتكاملة</h1>
          <p className="text-muted-foreground">
            إدارة شاملة للمستثمرين مع ربط المخزون والمبيعات
          </p>
        </div>
        <Button 
          onClick={handleMigrateData} 
          disabled={isLoading}
          className="gap-2"
        >
          <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          ترحيل البيانات
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستثمرين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستثمارات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {investors.reduce((sum, inv) => sum + inv.investedAmount, 0).toLocaleString('ar-EG')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات المملوكة</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {investors.reduce((sum, inv) => {
                const products = inventoryManager.getInvestorProducts(inv.id);
                return sum + products.length;
              }, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {investors.reduce((sum, inv) => {
                return sum + inventoryManager.calculateInvestorStockValue(inv.id);
              }, 0).toLocaleString('ar-EG')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Investors List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>قائمة المستثمرين</CardTitle>
            <CardDescription>اختر مستثمر لعرض التفاصيل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {investors.map((investor) => {
              const analytics = getInvestorAnalytics(investor.id);
              return (
                <div
                  key={investor.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedInvestor === investor.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedInvestor(investor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{investor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {investor.investedAmount.toLocaleString('ar-EG')} ر.س
                      </p>
                    </div>
                    <div className="text-left">
                      {analytics && (
                        <Badge variant={analytics.totalProfit >= 0 ? "default" : "destructive"}>
                          {analytics.totalProfit >= 0 ? '+' : ''}{analytics.totalProfit.toLocaleString('ar-EG')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Investor Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>تفاصيل المستثمر</CardTitle>
            {selectedInvestorData && (
              <CardDescription>
                {selectedInvestorData.name} - {selectedInvestorData.id}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedInvestorData && selectedInvestorAnalytics ? (
              <div className="space-y-6">
                {/* Investment Overview */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">المبلغ المستثمر</p>
                    <p className="text-2xl font-bold">
                      {selectedInvestorData.investedAmount.toLocaleString('ar-EG')} ر.س
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">المبلغ المتبقي</p>
                    <p className="text-2xl font-bold">
                      {selectedInvestorData.remainingAmount.toLocaleString('ar-EG')} ر.س
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">قيمة المخزون الحالي</p>
                    <p className="text-2xl font-bold">
                      {selectedInvestorAnalytics.currentStockValue.toLocaleString('ar-EG')} ر.س
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">صافي الربح</p>
                    <p className={`text-2xl font-bold ${selectedInvestorAnalytics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedInvestorAnalytics.totalProfit >= 0 ? '+' : ''}{selectedInvestorAnalytics.totalProfit.toLocaleString('ar-EG')} ر.س
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Performance Metrics */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                      <p className="font-bold">{selectedInvestorAnalytics.totalSales.toLocaleString('ar-EG')} ر.س</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">هامش الربح</p>
                      <p className="font-bold">{selectedInvestorAnalytics.profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">عدد المنتجات</p>
                      <p className="font-bold">{selectedInvestorAnalytics.totalProducts}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Recent Movements */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    آخر الحركات
                  </h3>
                  <div className="space-y-2">
                    {selectedInvestorAnalytics.recentMovements.map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          {movement.type === 'in' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{movement.productName}</p>
                            <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{movement.quantity} قطعة</p>
                          <p className="text-sm text-muted-foreground">
                            {movement.value.toLocaleString('ar-EG')} ر.س
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>اختر مستثمر لعرض التفاصيل</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}