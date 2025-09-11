import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { formatNumberEnglish } from '@/utils/numberLocalization';

interface StockAlert {
  id: string;
  productName: string;
  code: string;
  currentStock: number;
  minStock: number;
  type: 'low' | 'out';
  category: string;
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStockAlerts();
    // تحديث التنبيهات كل دقيقة
    const interval = setInterval(loadStockAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStockAlerts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'InventoryAlerts');
        return;
      }

      // جلب جميع المنتجات النشطة للمستخدم
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, code, stock, min_stock, category')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      if (!products || products.length === 0) {
        setAlerts([]);
        return;
      }

      const stockAlerts: StockAlert[] = [];
      
      products.forEach((product) => {
        const currentStock = product.stock || 0;
        const minStock = product.min_stock || 5;
        
        // المنتجات نافدة المخزون
        if (currentStock === 0) {
          stockAlerts.push({
            id: product.id,
            productName: product.name || 'منتج غير محدد',
            code: product.code || 'غير محدد',
            currentStock: 0,
            minStock: minStock,
            type: 'out' as const,
            category: product.category || 'غير محدد'
          });
        }
        // المنتجات منخفضة المخزون (أقل من أو يساوي الحد الأدنى)
        else if (currentStock <= minStock) {
          stockAlerts.push({
            id: product.id,
            productName: product.name || 'منتج غير محدد',
            code: product.code || 'غير محدد',
            currentStock: currentStock,
            minStock: minStock,
            type: 'low' as const,
            category: product.category || 'غير محدد'
          });
        }
      });
      
      setAlerts(stockAlerts);
    } catch (error) {
      logger.error('خطأ في تحميل تنبيهات المخزون من Supabase:', error, 'InventoryAlerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            تنبيهات المخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 space-x-reverse animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Package className="h-5 w-5" />
            حالة المخزون (مباشرة)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Package className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-green-600">جميع المنتجات متوفرة بكمية كافية</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="h-5 w-5" />
          تنبيهات المخزون (مباشرة) ({formatNumberEnglish(alerts.length)})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="stock-alerts">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {alert.type === 'out' ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-sm">{alert.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    كود: {alert.code} | فئة: {alert.category}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <Badge variant={alert.type === 'out' ? 'destructive' : 'secondary'}>
                  {alert.type === 'out' ? 'نفدت الكمية' : 'كمية قليلة'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  متوفر: {formatNumberEnglish(alert.currentStock)} | الحد الأدنى: {formatNumberEnglish(alert.minStock)}
                </p>
              </div>
            </div>
          ))}
          
          {alerts.length > 5 && (
            <div className="text-center pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/inventory/stock')}
              >
                عرض جميع التنبيهات ({formatNumberEnglish(alerts.length)})
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/inventory/products')}
            >
              إدارة المنتجات
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/inventory/stock')}
            >
              عرض المخزون
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}