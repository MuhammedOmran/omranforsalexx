import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  RefreshCw,
  FileText,
  ArrowRight
} from "lucide-react";
import { inventoryManager } from '@/utils/inventoryUtils';
import { useToast } from "@/hooks/use-toast";
import { useAppIntegration } from '@/contexts/AppIntegrationContext';

interface SalesInventoryData {
  invoiceId: string;
  customerName: string;
  date: string;
  items: Array<{
    productName: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    movementId?: string;
  }>;
  total: number;
  status: 'synced' | 'pending' | 'error';
}

export function SalesInventorySync() {
  const [recentSales, setRecentSales] = useState<SalesInventoryData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { syncAllData } = useAppIntegration();

  useEffect(() => {
    loadRecentSalesData();
    loadStockAlerts();
  }, []);

  const loadRecentSalesData = () => {
    try {
      const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
      const movements = inventoryManager.getMovements();
      
      const salesData: SalesInventoryData[] = salesInvoices
        .slice(-10) // آخر 10 فواتير
        .map((invoice: any) => {
          const items = (invoice.itemsDetails || invoice.items || []).map((item: any) => {
            const relatedMovement = movements.find(m => 
              m.referenceId === invoice.id && 
              m.productId === item.productId &&
              m.type === 'out'
            );
            
            return {
              productName: item.productName,
              quantity: item.quantity,
              stockBefore: relatedMovement ? 
                (inventoryManager.getProducts().find(p => p.id === item.productId)?.stock || 0) + item.quantity :
                0,
              stockAfter: inventoryManager.getProducts().find(p => p.id === item.productId)?.stock || 0,
              movementId: relatedMovement?.id
            };
          });

          return {
            invoiceId: invoice.id,
            customerName: invoice.customerName,
            date: invoice.date,
            items,
            total: invoice.total,
            status: items.every(item => item.movementId) ? 'synced' as const : 'pending' as const
          };
        });

      setRecentSales(salesData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const loadStockAlerts = () => {
    const lowStock = inventoryManager.getLowStockProducts();
    const outOfStock = inventoryManager.getOutOfStockProducts();
    setStockAlerts([...lowStock, ...outOfStock]);
  };

  const handleRefreshSync = async () => {
    setIsLoading(true);
    try {
      await syncAllData();
      loadRecentSalesData();
      loadStockAlerts();
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات ربط المبيعات والمخزون"
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'synced': return 'مربوط';
      case 'pending': return 'في الانتظار';
      case 'error': return 'خطأ';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ربط المبيعات بالمخزون</h2>
          <p className="text-muted-foreground">متابعة تحديثات المخزون من المبيعات</p>
        </div>
        <Button onClick={handleRefreshSync} disabled={isLoading}>
          <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>تنبيه مخزون:</strong> يوجد {stockAlerts.length} منتج يحتاج إعادة تموين
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            المبيعات الأخيرة وتأثيرها على المخزون
          </CardTitle>
          <CardDescription>
            آخر 10 فواتير مبيعات وحالة ربطها بالمخزون
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد فواتير مبيعات حديثة
              </p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.invoiceId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getSyncStatusColor(sale.status)}`} />
                      <div>
                        <h4 className="font-medium">فاتورة {sale.invoiceId}</h4>
                        <p className="text-sm text-muted-foreground">
                          {sale.customerName} • {new Date(sale.date).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant={sale.status === 'synced' ? 'default' : 'secondary'}>
                        {getSyncStatusText(sale.status)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {sale.total.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    {sale.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{item.productName}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.quantity} قطعة
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{item.stockBefore}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className={item.stockAfter < 5 ? 'text-red-600 font-medium' : ''}>
                            {item.stockAfter}
                          </span>
                          {item.movementId ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">فواتير مربوطة</p>
                <p className="text-2xl font-bold">
                  {recentSales.filter(s => s.status === 'synced').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">منتجات تحتاج تموين</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stockAlerts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                <p className="text-2xl font-bold">
                  {inventoryManager.getProducts().length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}