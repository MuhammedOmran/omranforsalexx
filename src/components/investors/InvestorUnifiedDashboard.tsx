import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useInvestorIntegration } from '@/hooks/useInvestorIntegration';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Activity,
  Users,
  BarChart3,
  RefreshCw,
  Link,
  AlertCircle,
  CheckCircle,
  Archive,
  Wallet
} from 'lucide-react';

export function InvestorUnifiedDashboard() {
  const { 
    integratedData, 
    isLoading, 
    overallStats,
    generalPurchases,
    generalSales,
    linkInvestorToPurchase,
    linkInvestorToSale,
    syncInventoryWithInvestor,
    refreshData
  } = useInvestorIntegration();
  
  const { toast } = useToast();
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [syncingInvestor, setSyncingInvestor] = useState<string | null>(null);

  const selectedInvestorData = selectedInvestor 
    ? integratedData.find(data => data.investor.id === selectedInvestor)
    : null;

  const handleLinkToPurchase = async (investorId: string, purchaseId: string) => {
    try {
      const success = linkInvestorToPurchase(investorId, purchaseId);
      if (success) {
        toast({
          title: "تم الربط بنجاح",
          description: "تم ربط المستثمر بفاتورة الشراء",
        });
        refreshData();
      } else {
        toast({
          title: "فشل في الربط",
          description: "حدث خطأ أثناء ربط المستثمر بالفاتورة",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الربط",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const handleLinkToSale = async (investorId: string, saleId: string) => {
    try {
      const success = linkInvestorToSale(investorId, saleId);
      if (success) {
        toast({
          title: "تم الربط بنجاح",
          description: "تم ربط المستثمر بفاتورة البيع",
        });
        refreshData();
      } else {
        toast({
          title: "فشل في الربط",
          description: "حدث خطأ أثناء ربط المستثمر بالفاتورة",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الربط",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  const handleSyncInventory = async (investorId: string) => {
    setSyncingInvestor(investorId);
    try {
      const success = syncInventoryWithInvestor(investorId);
      if (success) {
        toast({
          title: "تمت المزامنة بنجاح",
          description: "تم مزامنة مخزون المستثمر",
        });
        refreshData();
      } else {
        toast({
          title: "فشل في المزامنة",
          description: "حدث خطأ أثناء مزامنة المخزون",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في المزامنة",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setSyncingInvestor(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة المستثمرين الموحدة</h1>
          <p className="text-muted-foreground">
            إدارة شاملة ومتكاملة للمستثمرين والمشتريات والمبيعات والمخزون
          </p>
        </div>
        <Button onClick={refreshData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          تحديث البيانات
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستثمرين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalInvestors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستثمارات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalInvestment.toLocaleString('ar-EG')} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الأرباح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallStats.totalProfit >= 0 ? '+' : ''}{overallStats.totalProfit.toLocaleString('ar-EG')} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalStockValue.toLocaleString('ar-EG')} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="investors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="investors">المستثمرون</TabsTrigger>
          <TabsTrigger value="integration">الربط والتكامل</TabsTrigger>
          <TabsTrigger value="purchases">المشتريات</TabsTrigger>
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
        </TabsList>

        {/* Investors Tab */}
        <TabsContent value="investors" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Investors List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>قائمة المستثمرين</CardTitle>
                <CardDescription>اختر مستثمر لعرض التفاصيل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {integratedData.map((data) => (
                  <div
                    key={data.investor.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedInvestor === data.investor.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedInvestor(data.investor.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{data.investor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.totalInvestment.toLocaleString('ar-EG')} ر.س
                        </p>
                      </div>
                      <div className="text-left">
                        <Badge variant={data.totalProfit >= 0 ? "default" : "destructive"}>
                          {data.roi.toFixed(1)}% ROI
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Investor Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>تفاصيل المستثمر</CardTitle>
                {selectedInvestorData && (
                  <CardDescription>
                    {selectedInvestorData.investor.name} - {selectedInvestorData.investor.id}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedInvestorData ? (
                  <div className="space-y-6">
                    {/* Investment Overview */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">المبلغ المستثمر</p>
                        <p className="text-2xl font-bold">
                          {selectedInvestorData.totalInvestment.toLocaleString('ar-EG')} ر.س
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">المبلغ المنفق</p>
                        <p className="text-2xl font-bold">
                          {selectedInvestorData.totalSpent.toLocaleString('ar-EG')} ر.س
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">قيمة المخزون الحالي</p>
                        <p className="text-2xl font-bold">
                          {selectedInvestorData.currentStockValue.toLocaleString('ar-EG')} ر.س
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">صافي الربح</p>
                        <p className={`text-2xl font-bold ${selectedInvestorData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedInvestorData.totalProfit >= 0 ? '+' : ''}{selectedInvestorData.totalProfit.toLocaleString('ar-EG')} ر.س
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Performance Metrics */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">هامش الربح</p>
                          <p className="font-bold">{selectedInvestorData.profitMargin.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">عائد الاستثمار</p>
                          <p className="font-bold">{selectedInvestorData.roi.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">عدد المنتجات</p>
                          <p className="font-bold">{selectedInvestorData.inventory.length}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleSyncInventory(selectedInvestorData.investor.id)}
                        disabled={syncingInvestor === selectedInvestorData.investor.id}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${syncingInvestor === selectedInvestorData.investor.id ? 'animate-spin' : ''}`} />
                        مزامنة المخزون
                      </Button>
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
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Purchase Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  ربط المشتريات
                </CardTitle>
                <CardDescription>
                  ربط فواتير الشراء الموجودة بالمستثمرين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {generalPurchases.slice(0, 5).map((purchase: any) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">فاتورة رقم {purchase.id}</p>
                      <p className="text-sm text-muted-foreground">{purchase.supplier}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{purchase.total?.toLocaleString('ar-EG')} ر.س</Badge>
                      {purchase.investorId ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Button size="sm" variant="outline">
                          <Link className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sales Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ربط المبيعات
                </CardTitle>
                <CardDescription>
                  ربط فواتير البيع الموجودة بالمستثمرين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {generalSales.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">فاتورة رقم {sale.id}</p>
                      <p className="text-sm text-muted-foreground">{sale.customerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{sale.total?.toLocaleString('ar-EG')} ر.س</Badge>
                      {sale.investorId ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Button size="sm" variant="outline">
                          <Link className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مشتريات المستثمرين</CardTitle>
              <CardDescription>عرض جميع مشتريات المستثمرين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integratedData.map((data) => (
                  <div key={data.investor.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{data.investor.name}</h3>
                      <Badge>{data.purchases.length} عملية شراء</Badge>
                    </div>
                    <div className="space-y-2">
                      {data.purchases.map((purchase: any) => (
                        <div key={purchase.id} className="flex items-center justify-between text-sm">
                          <span>{purchase.productType}</span>
                          <span>{purchase.quantity} × {purchase.totalCost.toLocaleString('ar-EG')} ر.س</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مبيعات المستثمرين</CardTitle>
              <CardDescription>عرض جميع مبيعات المستثمرين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integratedData.map((data) => (
                  <div key={data.investor.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{data.investor.name}</h3>
                      <Badge>{data.sales.length} عملية بيع</Badge>
                    </div>
                    <div className="space-y-2">
                      {data.sales.map((sale: any) => (
                        <div key={sale.id} className="flex items-center justify-between text-sm">
                          <span>كمية {sale.quantitySold}</span>
                          <span className="text-green-600">+{sale.profit.toLocaleString('ar-EG')} ر.س</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}