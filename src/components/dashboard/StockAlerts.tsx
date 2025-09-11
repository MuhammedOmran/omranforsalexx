import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { formatNumberEnglish } from '@/utils/numberLocalization';

interface StockAlert {
  id: string;
  productName: string;
  currentStock: number;
  minStock: number;
  status: "low" | "out" | "critical";
}

function getStatusColor(status: string) {
  switch (status) {
    case "out":
      return "destructive";
    case "critical":
      return "warning";
    case "low":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "out":
      return "نفد المخزون";
    case "critical":
      return "حرج";
    case "low":
      return "منخفض";
    default:
      return "منخفض";
  }
}

export function StockAlerts() {
  const navigate = useNavigate();
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

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
        logger.warn('User not authenticated', {}, 'StockAlerts');
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
        setStockAlerts([]);
        return;
      }

      const alerts: StockAlert[] = [];
      
      products.forEach((product) => {
        const currentStock = product.stock || 0;
        const minStock = product.min_stock || 5;
        
        // المنتجات نافدة المخزون
        if (currentStock === 0) {
          alerts.push({
            id: product.id,
            productName: product.name || 'منتج غير محدد',
            currentStock: 0,
            minStock: minStock,
            status: "out"
          });
        }
        // المنتجات في حالة حرجة (أقل من 50% من الحد الأدنى)
        else if (currentStock > 0 && currentStock < (minStock * 0.5)) {
          alerts.push({
            id: product.id,
            productName: product.name || 'منتج غير محدد',
            currentStock: currentStock,
            minStock: minStock,
            status: "critical"
          });
        }
        // المنتجات منخفضة المخزون (أقل من أو يساوي الحد الأدنى)
        else if (currentStock <= minStock && currentStock > 0) {
          alerts.push({
            id: product.id,
            productName: product.name || 'منتج غير محدد',
            currentStock: currentStock,
            minStock: minStock,
            status: "low"
          });
        }
      });

      // ترتيب التنبيهات حسب الأولوية (نافد > حرج > منخفض)
      const sortedAlerts = alerts.sort((a, b) => {
        const priority = { out: 3, critical: 2, low: 1 };
        return priority[b.status] - priority[a.status];
      });

      setStockAlerts(sortedAlerts.slice(0, 5)); // أهم 5 تنبيهات
    } catch (error) {
      logger.error('خطأ في تحميل تنبيهات المخزون من Supabase:', error, 'StockAlerts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate('/inventory/stock');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          تنبيهات المخزون (مباشرة)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1" data-testid="stock-alerts">
          {stockAlerts.length > 0 ? (
            stockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 hover:bg-card-hover transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {alert.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      المتوفر: {formatNumberEnglish(alert.currentStock)} | الحد الأدنى: {formatNumberEnglish(alert.minStock)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(alert.status) as any} className="text-xs">
                    {getStatusText(alert.status)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-success mb-4" />
              <p className="text-success">جميع المنتجات متوفرة بكمية كافية</p>
              <p className="text-sm text-muted-foreground mt-2">
                لا توجد تنبيهات مخزون حالياً
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border">
          <Button size="sm" className="w-full" variant="outline" onClick={handleViewAll}>
            <TrendingDown className="h-4 w-4 ml-2" />
            عرض جميع التنبيهات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}