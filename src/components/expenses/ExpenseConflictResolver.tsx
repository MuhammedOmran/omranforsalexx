import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, Merge, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { expensesManager } from '@/utils/expensesManager';

interface ConflictItem {
  type: string;
  description: string;
  amount: number;
  suggestions: string[];
}

export default function ExpenseConflictResolver() {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = () => {
    const detectedConflicts = expensesManager.getConflicts();
    setConflicts(detectedConflicts);
  };

  const handleAutoResolve = async (preference: 'keep_manual' | 'keep_expense_system' | 'merge') => {
    setIsResolving(true);
    try {
      const success = expensesManager.autoResolveConflicts(preference);
      if (success) {
        toast({
          title: "تم حل التعارضات",
          description: "تم حل جميع التعارضات بنجاح",
        });
        loadConflicts();
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حل التعارضات",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsResolving(false);
    }
  };

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            لا توجد تعارضات
          </CardTitle>
          <CardDescription>
            النظام يعمل بشكل متزامن بين الصندوق ونظام المصروفات
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            تعارضات محتملة ({conflicts.length})
          </CardTitle>
          <CardDescription className="text-orange-700">
            تم اكتشاف مصروفات قد تكون مُدخلة في كلا النظامين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* عرض التعارضات */}
          <div className="space-y-3">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{conflict.description}</h4>
                    <p className="text-sm text-gray-600">
                      {conflict.amount.toLocaleString()} ج.م
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    {conflict.type === 'potential_duplicate' ? 'تكرار محتمل' : conflict.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* خيارات الحل */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">خيارات الحل التلقائي:</h4>
            <div className="grid gap-2 md:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => handleAutoResolve('keep_expense_system')}
                disabled={isResolving}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                أولوية نظام المصروفات
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAutoResolve('keep_manual')}
                disabled={isResolving}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                أولوية الصندوق
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAutoResolve('merge')}
                disabled={isResolving}
                className="flex items-center gap-2"
              >
                <Merge className="h-4 w-4" />
                دمج مع تمييز
              </Button>
            </div>
          </div>

          {/* التوضيح */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>أولوية نظام المصروفات:</strong> حذف المدخلات اليدوية المكررة من الصندوق</p>
            <p><strong>أولوية الصندوق:</strong> عدم مزامنة المصروفات المكررة تلقائياً</p>
            <p><strong>دمج مع تمييز:</strong> الاحتفاظ بالنظامين مع تسميات واضحة</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}