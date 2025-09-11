import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { useChecks, Check } from "@/hooks/useChecks";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CheckAlert {
  id: string;
  checkNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  daysDue?: number;
  type: 'overdue' | 'due_soon' | 'bounced';
  priority: 'high' | 'medium' | 'low';
}

export function ChecksAlerts() {
  const [alerts, setAlerts] = useState<CheckAlert[]>([]);
  const navigate = useNavigate();
  const { checks, loading } = useChecks();

  useEffect(() => {
    if (!loading && checks.length > 0) {
      loadChecksAlerts();
    }
  }, [checks, loading]);

  const loadChecksAlerts = () => {
    try {
      const today = new Date();
      const alertsList: CheckAlert[] = [];

      checks.forEach(check => {
        const dueDate = new Date(check.due_date);
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // الشيكات المرتدة
        if (check.status === 'bounced') {
          alertsList.push({
            id: check.id,
            checkNumber: check.check_number,
            customerName: check.customer_name,
            amount: check.amount,
            dueDate: check.due_date,
            type: 'bounced',
            priority: 'high'
          });
        }
        
        // الشيكات المتأخرة (معلقة وتجاوزت موعد الاستحقاق)
        else if (check.status === 'pending' && daysDiff < 0) {
          alertsList.push({
            id: check.id,
            checkNumber: check.check_number,
            customerName: check.customer_name,
            amount: check.amount,
            dueDate: check.due_date,
            daysOverdue: Math.abs(daysDiff),
            type: 'overdue',
            priority: Math.abs(daysDiff) > 7 ? 'high' : 'medium'
          });
        }
        
        // الشيكات المستحقة قريباً (خلال 7 أيام)
        else if (check.status === 'pending' && daysDiff >= 0 && daysDiff <= 7) {
          alertsList.push({
            id: check.id,
            checkNumber: check.check_number,
            customerName: check.customer_name,
            amount: check.amount,
            dueDate: check.due_date,
            daysDue: daysDiff,
            type: 'due_soon',
            priority: daysDiff <= 2 ? 'high' : daysDiff <= 5 ? 'medium' : 'low'
          });
        }
      });

      // ترتيب التنبيهات حسب الأولوية والتاريخ
      alertsList.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setAlerts(alertsList.slice(0, 10)); // أول 10 تنبيهات
    } catch (error) {
      console.error('خطأ في تحميل تنبيهات الشيكات:', error);
    }
  };

  const getAlertIcon = (type: CheckAlert['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'due_soon':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getAlertMessage = (alert: CheckAlert) => {
    switch (alert.type) {
      case 'overdue':
        return `متأخر ${alert.daysOverdue} ${alert.daysOverdue === 1 ? 'يوم' : 'أيام'}`;
      case 'due_soon':
        return alert.daysDue === 0 ? 'مستحق اليوم' : `مستحق خلال ${alert.daysDue} ${alert.daysDue === 1 ? 'يوم' : 'أيام'}`;
      case 'bounced':
        return 'شيك مرتد - يتطلب متابعة';
      default:
        return '';
    }
  };

  const getAlertVariant = (priority: CheckAlert['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleViewChecks = () => {
    navigate('/checks');
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            تنبيهات الشيكات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
            <p className="text-muted-foreground">لا توجد تنبيهات حالياً</p>
            <p className="text-sm text-muted-foreground mt-1">
              جميع الشيكات في حالة جيدة
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          تنبيهات الشيكات ({alerts.length})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleViewChecks}>
          <Eye className="h-4 w-4 ml-2" />
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center justify-between p-4 hover:bg-card-hover transition-colors border-b border-border last:border-b-0",
                alert.priority === 'high' && "bg-red-50 border-red-100",
                alert.priority === 'medium' && "bg-amber-50 border-amber-100"
              )}
            >
              <div className="flex items-center gap-3">
                {getAlertIcon(alert.type)}
                <div>
                  <p className="font-medium text-sm">
                    شيك رقم {alert.checkNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.customerName} • {alert.amount.toLocaleString()} ج.م
                  </p>
                </div>
              </div>
              
              <div className="text-left">
                <Badge variant={getAlertVariant(alert.priority) as any} className="text-xs">
                  {getAlertMessage(alert)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(alert.dueDate).toLocaleDateString('ar-SA', { numberingSystem: 'latn' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}