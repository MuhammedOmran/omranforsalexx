import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useInvestorIntegration } from '@/hooks/useInvestorIntegration';
import { useInvestor } from '@/contexts/InvestorContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Link2, 
  Database, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Settings,
  ArrowRight
} from 'lucide-react';

export default function SystemIntegration() {
  const { 
    integratedData, 
    isLoading, 
    generalPurchases,
    generalSales,
    linkInvestorToPurchase,
    linkInvestorToSale,
    syncInventoryWithInvestor,
    refreshData
  } = useInvestorIntegration();
  
  const { investors } = useInvestor();
  const { toast } = useToast();
  
  const [selectedInvestor, setSelectedInvestor] = useState<string>('');
  const [selectedPurchase, setSelectedPurchase] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkPurchase = async () => {
    if (!selectedInvestor || !selectedPurchase) return;
    
    setIsLinking(true);
    try {
      const success = linkInvestorToPurchase(selectedInvestor, selectedPurchase);
      if (success) {
        toast({
          title: "تم الربط بنجاح",
          description: "تم ربط المستثمر بفاتورة الشراء",
        });
        setSelectedPurchase('');
        refreshData();
      } else {
        toast({
          title: "فشل في الربط",
          description: "تعذر ربط المستثمر بفاتورة الشراء",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ أثناء عملية الربط",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkSale = async () => {
    if (!selectedInvestor || !selectedSale) return;
    
    setIsLinking(true);
    try {
      const success = linkInvestorToSale(selectedInvestor, selectedSale);
      if (success) {
        toast({
          title: "تم الربط بنجاح",
          description: "تم ربط المستثمر بفاتورة البيع",
        });
        setSelectedSale('');
        refreshData();
      } else {
        toast({
          title: "فشل في الربط",
          description: "تعذر ربط المستثمر بفاتورة البيع",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ أثناء عملية الربط",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleSyncAllInventory = async () => {
    setIsLinking(true);
    try {
      let successCount = 0;
      for (const investor of investors) {
        const success = syncInventoryWithInvestor(investor.id);
        if (success) successCount++;
      }
      
      toast({
        title: "تمت المزامنة",
        description: `تم مزامنة ${successCount} من ${investors.length} مستثمر`,
      });
      refreshData();
    } catch (error) {
      toast({
        title: "خطأ في المزامنة",
        description: "حدث خطأ أثناء مزامنة المخزون",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkedPurchases = generalPurchases.filter((p: any) => !p.investorId);
  const unlinkedSales = generalSales.filter((s: any) => !s.investorId);
  const linkedPurchases = generalPurchases.filter((p: any) => p.investorId);
  const linkedSales = generalSales.filter((s: any) => s.investorId);

  const integrationProgress = {
    purchases: generalPurchases.length > 0 ? (linkedPurchases.length / generalPurchases.length) * 100 : 0,
    sales: generalSales.length > 0 ? (linkedSales.length / generalSales.length) * 100 : 0,
    inventory: investors.length > 0 ? (integratedData.filter(d => d.inventory.length > 0).length / investors.length) * 100 : 0
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تكامل الأنظمة</h1>
          <p className="text-muted-foreground">
            ربط وتكامل أنظمة المستثمرين مع المشتريات والمبيعات والمخزون
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
          <Button onClick={handleSyncAllInventory} disabled={isLinking} className="gap-2">
            <Database className={`h-4 w-4 ${isLinking ? 'animate-spin' : ''}`} />
            مزامنة شاملة
          </Button>
        </div>
      </div>

      {/* Integration Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ربط المشتريات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {integrationProgress.purchases.toFixed(0)}%
            </div>
            <Progress value={integrationProgress.purchases} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {linkedPurchases.length} من {generalPurchases.length} مربوطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ربط المبيعات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {integrationProgress.sales.toFixed(0)}%
            </div>
            <Progress value={integrationProgress.sales} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {linkedSales.length} من {generalSales.length} مربوطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ربط المخزون</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {integrationProgress.inventory.toFixed(0)}%
            </div>
            <Progress value={integrationProgress.inventory} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {integratedData.filter(d => d.inventory.length > 0).length} من {investors.length} متصلين
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="purchases">ربط المشتريات</TabsTrigger>
          <TabsTrigger value="sales">ربط المبيعات</TabsTrigger>
          <TabsTrigger value="inventory">مزامنة المخزون</TabsTrigger>
          <TabsTrigger value="status">حالة النظام</TabsTrigger>
        </TabsList>

        {/* Purchases Integration */}
        <TabsContent value="purchases" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Manual Linking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  ربط يدوي للمشتريات
                </CardTitle>
                <CardDescription>
                  ربط فواتير الشراء بالمستثمرين يدوياً
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">اختر المستثمر</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedInvestor}
                    onChange={(e) => setSelectedInvestor(e.target.value)}
                  >
                    <option value="">-- اختر مستثمر --</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">اختر فاتورة الشراء</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedPurchase}
                    onChange={(e) => setSelectedPurchase(e.target.value)}
                  >
                    <option value="">-- اختر فاتورة --</option>
                    {unlinkedPurchases.map((purchase: any) => (
                      <option key={purchase.id} value={purchase.id}>
                        {purchase.id} - {purchase.supplier} ({purchase.total?.toLocaleString('ar-EG')} ر.س)
                      </option>
                    ))}
                  </select>
                </div>

                <Button 
                  onClick={handleLinkPurchase}
                  disabled={!selectedInvestor || !selectedPurchase || isLinking}
                  className="w-full gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  ربط الفاتورة
                </Button>
              </CardContent>
            </Card>

            {/* Unlinked Purchases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  مشتريات غير مربوطة
                </CardTitle>
                <CardDescription>
                  فواتير شراء تحتاج إلى ربط بالمستثمرين
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {unlinkedPurchases.map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">فاتورة {purchase.id}</p>
                        <p className="text-sm text-muted-foreground">{purchase.supplier}</p>
                      </div>
                      <Badge variant="outline">
                        {purchase.total?.toLocaleString('ar-EG')} ر.س
                      </Badge>
                    </div>
                  ))}
                  {unlinkedPurchases.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>جميع المشتريات مربوطة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Integration */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Manual Linking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  ربط يدوي للمبيعات
                </CardTitle>
                <CardDescription>
                  ربط فواتير البيع بالمستثمرين يدوياً
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">اختر المستثمر</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedInvestor}
                    onChange={(e) => setSelectedInvestor(e.target.value)}
                  >
                    <option value="">-- اختر مستثمر --</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">اختر فاتورة البيع</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedSale}
                    onChange={(e) => setSelectedSale(e.target.value)}
                  >
                    <option value="">-- اختر فاتورة --</option>
                    {unlinkedSales.map((sale: any) => (
                      <option key={sale.id} value={sale.id}>
                        {sale.id} - {sale.customerName} ({sale.total?.toLocaleString('ar-EG')} ر.س)
                      </option>
                    ))}
                  </select>
                </div>

                <Button 
                  onClick={handleLinkSale}
                  disabled={!selectedInvestor || !selectedSale || isLinking}
                  className="w-full gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  ربط الفاتورة
                </Button>
              </CardContent>
            </Card>

            {/* Unlinked Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  مبيعات غير مربوطة
                </CardTitle>
                <CardDescription>
                  فواتير بيع تحتاج إلى ربط بالمستثمرين
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {unlinkedSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">فاتورة {sale.id}</p>
                        <p className="text-sm text-muted-foreground">{sale.customerName}</p>
                      </div>
                      <Badge variant="outline">
                        {sale.total?.toLocaleString('ar-EG')} ر.س
                      </Badge>
                    </div>
                  ))}
                  {unlinkedSales.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>جميع المبيعات مربوطة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Sync */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {integratedData.map((data) => (
              <Card key={data.investor.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{data.investor.name}</CardTitle>
                      <CardDescription>
                        {data.inventory.length} منتج - {data.currentStockValue.toLocaleString('ar-EG')} ر.س
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => syncInventoryWithInvestor(data.investor.id)}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      مزامنة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {data.inventory.slice(0, 6).map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span>{product.name}</span>
                        <Badge variant="outline">{product.stock}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Status */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  حالة التكامل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>ربط المشتريات</span>
                  <Badge variant={integrationProgress.purchases > 80 ? "default" : "secondary"}>
                    {integrationProgress.purchases.toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>ربط المبيعات</span>
                  <Badge variant={integrationProgress.sales > 80 ? "default" : "secondary"}>
                    {integrationProgress.sales.toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>مزامنة المخزون</span>
                  <Badge variant={integrationProgress.inventory > 80 ? "default" : "secondary"}>
                    {integrationProgress.inventory.toFixed(0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>إجمالي المستثمرين</span>
                  <Badge>{investors.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>فواتير الشراء</span>
                  <Badge>{generalPurchases.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>فواتير البيع</span>
                  <Badge>{generalSales.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>المنتجات المتكاملة</span>
                  <Badge>{integratedData.reduce((sum, d) => sum + d.inventory.length, 0)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}