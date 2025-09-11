import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Bell, AlertTriangle, TrendingUp, Calendar, Settings, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";

interface BudgetAlert {
  id: string;
  category: string;
  monthlyBudget: number;
  warningThreshold: number; // نسبة مئوية
  criticalThreshold: number; // نسبة مئوية
  isActive: boolean;
  createdAt: string;
}

interface ExpenseAlert {
  id: string;
  type: 'budget_warning' | 'budget_critical' | 'unusual_spending' | 'pending_payment';
  category?: string;
  message: string;
  amount?: number;
  threshold?: number;
  isRead: boolean;
  createdAt: string;
}

interface ExpenseAlertsProps {
  expenses: any[];
}

const categories = [
  "إيجار المحل",
  "الكهرباء والمياه", 
  "رواتب الموظفين",
  "مصاريف التسويق",
  "صيانة المعدات",
  "مصاريف النقل",
  "أخرى"
];

export default function ExpenseAlerts({ expenses }: ExpenseAlertsProps) {
  const { toast } = useToast();
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>(() => 
    storage.getItem('budget_alerts', [])
  );
  const [activeAlerts, setActiveAlerts] = useState<ExpenseAlert[]>(() => 
    storage.getItem('expense_alerts', [])
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    monthlyBudget: "",
    warningThreshold: "75",
    criticalThreshold: "90"
  });

  // تحديث التنبيهات عند تغيير المصروفات
  useEffect(() => {
    checkBudgetAlerts();
    checkUnusualSpending();
    checkPendingPayments();
  }, [expenses, budgetAlerts]);

  // فحص تجاوز الميزانيات
  const checkBudgetAlerts = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear &&
             expense.status === 'paid';
    });

    const newAlerts: ExpenseAlert[] = [];

    budgetAlerts.forEach(budget => {
      if (!budget.isActive) return;

      const categoryExpenses = currentMonthExpenses
        .filter(expense => expense.category === budget.category)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const usagePercentage = (categoryExpenses / budget.monthlyBudget) * 100;

      // تنبيه حرج
      if (usagePercentage >= budget.criticalThreshold) {
        const existingAlert = activeAlerts.find(alert => 
          alert.type === 'budget_critical' && 
          alert.category === budget.category &&
          !alert.isRead
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'budget_critical',
            category: budget.category,
            message: `تجاوزت مصروفات "${budget.category}" ${usagePercentage.toFixed(1)}% من الميزانية الشهرية!`,
            amount: categoryExpenses,
            threshold: budget.monthlyBudget,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      // تنبيه تحذيري
      else if (usagePercentage >= budget.warningThreshold) {
        const existingAlert = activeAlerts.find(alert => 
          alert.type === 'budget_warning' && 
          alert.category === budget.category &&
          !alert.isRead
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'budget_warning',
            category: budget.category,
            message: `مصروفات "${budget.category}" وصلت إلى ${usagePercentage.toFixed(1)}% من الميزانية الشهرية`,
            amount: categoryExpenses,
            threshold: budget.monthlyBudget,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      const updatedAlerts = [...activeAlerts, ...newAlerts];
      setActiveAlerts(updatedAlerts);
      storage.setItem('expense_alerts', updatedAlerts);

      // إظهار toast للتنبيهات الجديدة
      newAlerts.forEach(alert => {
        toast({
          title: alert.type === 'budget_critical' ? "تحذير حرج!" : "تنبيه ميزانية",
          description: alert.message,
          variant: alert.type === 'budget_critical' ? "destructive" : "default"
        });
      });
    }
  };

  // فحص الإنفاق غير العادي
  const checkUnusualSpending = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === new Date().getMonth();
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === lastMonth.getMonth();
    }).reduce((sum, expense) => sum + expense.amount, 0);

    if (lastMonthExpenses > 0) {
      const increasePercentage = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      
      if (increasePercentage > 50) { // زيادة أكثر من 50%
        const existingAlert = activeAlerts.find(alert => 
          alert.type === 'unusual_spending' && !alert.isRead
        );

        if (!existingAlert) {
          const newAlert: ExpenseAlert = {
            id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'unusual_spending',
            message: `ارتفاع غير عادي في المصروفات بنسبة ${increasePercentage.toFixed(1)}% مقارنة بالشهر الماضي`,
            amount: currentMonthExpenses,
            isRead: false,
            createdAt: new Date().toISOString()
          };

          const updatedAlerts = [...activeAlerts, newAlert];
          setActiveAlerts(updatedAlerts);
          storage.setItem('expense_alerts', updatedAlerts);
        }
      }
    }
  };

  // فحص المدفوعات المعلقة
  const checkPendingPayments = () => {
    const pendingExpenses = expenses.filter(expense => expense.status === 'pending');
    const oldPendingExpenses = pendingExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const daysDiff = (new Date().getTime() - expenseDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff > 7; // أكثر من أسبوع
    });

    if (oldPendingExpenses.length > 0) {
      const existingAlert = activeAlerts.find(alert => 
        alert.type === 'pending_payment' && !alert.isRead
      );

      if (!existingAlert) {
        const totalPending = oldPendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const newAlert: ExpenseAlert = {
          id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'pending_payment',
          message: `يوجد ${oldPendingExpenses.length} مصروف معلق منذ أكثر من أسبوع بقيمة ${totalPending.toLocaleString()} ج.م`,
          amount: totalPending,
          isRead: false,
          createdAt: new Date().toISOString()
        };

        const updatedAlerts = [...activeAlerts, newAlert];
        setActiveAlerts(updatedAlerts);
        storage.setItem('expense_alerts', updatedAlerts);
      }
    }
  };

  // إضافة ميزانية جديدة
  const handleAddBudget = () => {
    if (!formData.category || !formData.monthlyBudget) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const newBudget: BudgetAlert = {
      id: `BUDGET_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      category: formData.category,
      monthlyBudget: parseFloat(formData.monthlyBudget),
      warningThreshold: parseFloat(formData.warningThreshold),
      criticalThreshold: parseFloat(formData.criticalThreshold),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updatedBudgets = [...budgetAlerts, newBudget];
    setBudgetAlerts(updatedBudgets);
    storage.setItem('budget_alerts', updatedBudgets);

    setFormData({
      category: "",
      monthlyBudget: "",
      warningThreshold: "75",
      criticalThreshold: "90"
    });
    setIsDialogOpen(false);

    toast({
      title: "تم الإضافة",
      description: "تم إضافة ميزانية جديدة بنجاح"
    });
  };

  // تبديل حالة الميزانية
  const toggleBudgetStatus = (budgetId: string) => {
    const updatedBudgets = budgetAlerts.map(budget =>
      budget.id === budgetId ? { ...budget, isActive: !budget.isActive } : budget
    );
    setBudgetAlerts(updatedBudgets);
    storage.setItem('budget_alerts', updatedBudgets);
  };

  // حذف ميزانية
  const deleteBudget = (budgetId: string) => {
    const updatedBudgets = budgetAlerts.filter(budget => budget.id !== budgetId);
    setBudgetAlerts(updatedBudgets);
    storage.setItem('budget_alerts', updatedBudgets);

    toast({
      title: "تم الحذف",
      description: "تم حذف الميزانية بنجاح"
    });
  };

  // وضع علامة مقروء على التنبيه
  const markAlertAsRead = (alertId: string) => {
    const updatedAlerts = activeAlerts.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    );
    setActiveAlerts(updatedAlerts);
    storage.setItem('expense_alerts', updatedAlerts);
  };

  // حذف التنبيه
  const deleteAlert = (alertId: string) => {
    const updatedAlerts = activeAlerts.filter(alert => alert.id !== alertId);
    setActiveAlerts(updatedAlerts);
    storage.setItem('expense_alerts', updatedAlerts);
  };

  const unreadAlerts = activeAlerts.filter(alert => !alert.isRead);

  // الحصول على نوع التنبيه
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'budget_critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'budget_warning': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'unusual_spending': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'pending_payment': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* التنبيهات النشطة */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-2">
          {unreadAlerts.map((alert) => (
            <Alert key={alert.id} className={`${
              alert.type === 'budget_critical' ? 'border-red-500 bg-red-50' :
              alert.type === 'budget_warning' ? 'border-yellow-500 bg-yellow-50' :
              alert.type === 'unusual_spending' ? 'border-orange-500 bg-orange-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.type)}
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => markAlertAsRead(alert.id)}>
                    تم القراءة
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteAlert(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* إدارة الميزانيات */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-cairo">
                <Settings className="h-5 w-5" />
                ميزانيات الفئات
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-cairo">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة ميزانية
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة ميزانية جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>الفئة</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الميزانية الشهرية</Label>
                      <Input
                        type="number"
                        value={formData.monthlyBudget}
                        onChange={(e) => setFormData({...formData, monthlyBudget: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>حد التحذير (%)</Label>
                      <Input
                        type="number"
                        value={formData.warningThreshold}
                        onChange={(e) => setFormData({...formData, warningThreshold: e.target.value})}
                        placeholder="75"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الحد الحرج (%)</Label>
                      <Input
                        type="number"
                        value={formData.criticalThreshold}
                        onChange={(e) => setFormData({...formData, criticalThreshold: e.target.value})}
                        placeholder="90"
                      />
                    </div>
                    <Button onClick={handleAddBudget} className="w-full">
                      إضافة الميزانية
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-tajawal">الفئة</TableHead>
                  <TableHead className="font-tajawal">الميزانية</TableHead>
                  <TableHead className="font-tajawal">الحالة</TableHead>
                  <TableHead className="font-tajawal">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetAlerts.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.category}</TableCell>
                    <TableCell>{budget.monthlyBudget.toLocaleString()} ج.م</TableCell>
                    <TableCell>
                      <Switch
                        checked={budget.isActive}
                        onCheckedChange={() => toggleBudgetStatus(budget.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBudget(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {budgetAlerts.length === 0 && (
              <div className="text-center py-6 text-muted-foreground font-tajawal">
                لا توجد ميزانيات محددة
              </div>
            )}
          </CardContent>
        </Card>

        {/* سجل التنبيهات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              سجل التنبيهات ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.isRead ? 'bg-muted/30' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className={`text-sm ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!alert.isRead && (
                        <Button size="sm" variant="ghost" onClick={() => markAlertAsRead(alert.id)}>
                          ✓
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteAlert(alert.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {activeAlerts.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                لا توجد تنبيهات
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}