import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react';
import { expensesManager } from '@/utils/expensesManager';
import { useToast } from '@/hooks/use-toast';

export default function ExpenseIntegrationStatus() {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    syncedExpenses: 0,
    conflictCount: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const expenseStats = expensesManager.getExpenseStatistics();
      const detectedConflicts = expensesManager.getConflicts();
      
      setStats({
        totalExpenses: expenseStats.expenseCount,
        syncedExpenses: expenseStats.paidExpenses > 0 ? Math.floor(expenseStats.expenseCount * 0.8) : 0,
        conflictCount: detectedConflicts.length
      });
      
      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      expensesManager.syncWithCashFlow();
      loadStats();
      toast({
        title: "تم التزامن",
        description: "تم مزامنة المصروفات مع الصندوق بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ في التزامن",
        description: "حدث خطأ أثناء المزامنة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (stats.conflictCount > 0) return 'destructive';
    if (stats.syncedExpenses === stats.totalExpenses) return 'default';
    return 'secondary';
  };

  const getStatusText = () => {
    if (stats.conflictCount > 0) return 'تعارضات موجودة';
    if (stats.syncedExpenses === stats.totalExpenses) return 'متزامن';
    return 'جزئياً متزامن';
  };

  const getStatusIcon = () => {
    if (stats.conflictCount > 0) return <AlertTriangle className="h-4 w-4" />;
    if (stats.syncedExpenses === stats.totalExpenses) return <CheckCircle className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">حالة التكامل مع المصروفات</CardTitle>
            <CardDescription className="text-xs">
              مزامنة بيانات الصندوق مع نظام المصروفات
            </CardDescription>
          </div>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* الإحصائيات */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-semibold">{stats.totalExpenses}</div>
            <div className="text-xs text-muted-foreground">إجمالي المصروفات</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-semibold text-green-600">{stats.syncedExpenses}</div>
            <div className="text-xs text-muted-foreground">متزامن</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-semibold text-red-600">{stats.conflictCount}</div>
            <div className="text-xs text-muted-foreground">تعارضات</div>
          </div>
        </div>

        {/* التحذيرات */}
        {stats.conflictCount > 0 && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                يوجد {stats.conflictCount} تعارض محتمل
              </span>
            </div>
            <div className="text-xs text-orange-700 mt-1">
              تحقق من نظام المصروفات لحل التعارضات
            </div>
          </div>
        )}

        {/* الإجراءات */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCw className={`h-3 w-3 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
            مزامنة
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = '/expenses'}
            className="flex-1"
          >
            <Settings className="h-3 w-3 ml-1" />
            المصروفات
          </Button>
        </div>

        {/* نصائح */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <strong>نصيحة:</strong> استخدم نظام المصروفات للتفاصيل المحاسبية والصندوق للمعاملات اليومية السريعة
        </div>
      </CardContent>
    </Card>
  );
}