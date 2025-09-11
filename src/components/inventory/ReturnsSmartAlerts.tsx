import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, TrendingUp, Package, Bell } from "lucide-react";
import { returnsManager } from "@/utils/returnsManager";
import { useMemo } from "react";

interface SmartAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  count?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ReturnsSmartAlerts() {
  const alerts = useMemo(() => {
    const returns = returnsManager.getReturns();
    const stats = returnsManager.getReturnStatistics();
    const reasonsAnalysis = returnsManager.getReturnReasonsAnalysis();
    const smartAlerts: SmartAlert[] = [];

    // تنبيه المرتجعات المعلقة لأكثر من 3 أيام
    const oldPendingReturns = returns.filter(ret => {
      if (ret.status !== 'pending') return false;
      const daysDiff = Math.floor((Date.now() - new Date(ret.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 3;
    });

    if (oldPendingReturns.length > 0) {
      smartAlerts.push({
        id: 'old-pending',
        type: 'warning',
        title: 'مرتجعات معلقة لفترة طويلة',
        description: `يوجد ${oldPendingReturns.length} مرتجع معلق لأكثر من 3 أيام`,
        priority: 'high',
        count: oldPendingReturns.length,
        action: {
          label: 'مراجعة المرتجعات',
          onClick: () => console.log('Navigate to pending returns')
        }
      });
    }

    // تنبيه ارتفاع معدل الإرجاع
    const currentMonth = new Date();
    const monthlyData = returnsManager.getMonthlyReturnsReport(
      currentMonth.getFullYear(), 
      currentMonth.getMonth() + 1
    );
    
    if (monthlyData.totalReturns > 10) { // حد معين للإنذار
      smartAlerts.push({
        id: 'high-return-rate',
        type: 'danger',
        title: 'ارتفاع معدل الإرجاع هذا الشهر',
        description: `${monthlyData.totalReturns} مرتجع هذا الشهر - أعلى من المعدل الطبيعي`,
        priority: 'high',
        count: monthlyData.totalReturns
      });
    }

    // تنبيه المنتجات الأكثر إرجاعاً
    const productReturns: { [key: string]: number } = {};
    returns.forEach(ret => {
      ret.items.forEach(item => {
        productReturns[item.productName] = (productReturns[item.productName] || 0) + item.quantity;
      });
    });

    const topReturnedProduct = Object.entries(productReturns)
      .sort(([,a], [,b]) => b - a)[0];

    if (topReturnedProduct && topReturnedProduct[1] > 5) {
      smartAlerts.push({
        id: 'top-returned-product',
        type: 'warning',
        title: 'منتج يحتاج مراجعة الجودة',
        description: `${topReturnedProduct[0]} تم إرجاعه ${topReturnedProduct[1]} مرات`,
        priority: 'medium',
        count: topReturnedProduct[1]
      });
    }

    // تنبيه تكرار أسباب معينة
    const defectiveReturns = reasonsAnalysis.find(r => r.reason === 'defective');
    if (defectiveReturns && defectiveReturns.percentage > 30) {
      smartAlerts.push({
        id: 'quality-issues',
        type: 'danger',
        title: 'مشكلة في جودة المنتجات',
        description: `${defectiveReturns.percentage.toFixed(1)}% من المرتجعات بسبب عيوب في المنتج`,
        priority: 'high',
        count: defectiveReturns.count
      });
    }

    // تنبيه المرتجعات المرفوضة التي قد تحتاج إعادة نظر
    const rejectedReturns = returns.filter(ret => ret.status === 'rejected');
    const recentRejected = rejectedReturns.filter(ret => {
      const daysDiff = Math.floor((Date.now() - new Date(ret.date).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });

    if (recentRejected.length > 3) {
      smartAlerts.push({
        id: 'recent-rejections',
        type: 'info',
        title: 'عدد مرتفع من المرتجعات المرفوضة',
        description: `تم رفض ${recentRejected.length} مرتجع هذا الأسبوع`,
        priority: 'low',
        count: recentRejected.length
      });
    }

    return smartAlerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, []);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Bell className="h-5 w-5" />
            التنبيهات الذكية
          </CardTitle>
          <CardDescription>لا توجد تنبيهات حالياً</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-500 mb-2">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-muted-foreground">كل شيء يعمل بشكل طبيعي</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          التنبيهات الذكية
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>تنبيهات مخصصة لتحسين إدارة المرتجعات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <Alert key={alert.id} className={`${
            alert.type === 'danger' ? 'border-red-200 bg-red-50' :
            alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getPriorityIcon(alert.priority)}
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    {alert.title}
                    {alert.count && (
                      <Badge variant={getPriorityColor(alert.priority) as any}>
                        {alert.count}
                      </Badge>
                    )}
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    {alert.description}
                  </AlertDescription>
                </div>
              </div>
              {alert.action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={alert.action.onClick}
                  className="mr-4"
                >
                  {alert.action.label}
                </Button>
              )}
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}