import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatNumberEnglish, formatCurrencyEnglish } from '@/utils/numberLocalization';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function CashFlowDashboard() {
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'CashFlowDashboard');
        return;
      }

      // الحصول على تواريخ الشهر الحالي والسابق
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(monthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      const lastMonthEnd = new Date(monthStart);
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

      // جلب بيانات الفواتير المدفوعة لهذا الشهر
      const { data: thisMonthInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('total_amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', monthStart.toISOString());

      if (invoicesError) throw invoicesError;

      // جلب بيانات الفواتير المدفوعة للشهر الماضي
      const { data: lastMonthInvoices } = await supabase
        .from('invoices')
        .select('total_amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', monthStart.toISOString());

      // جلب المعاملات النقدية لهذا الشهر
      const { data: cashTransactions, error: cashError } = await supabase
        .from('cash_transactions')
        .select('amount, transaction_type, created_at')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());

      if (cashError) throw cashError;

      // جلب الرصيد الحالي
      const { data: currentBalance } = await supabase
        .from('cash_balances')
        .select('current_balance')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      // حساب الإيرادات والمصروفات
      const thisMonthIncome = (thisMonthInvoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0) +
                             (cashTransactions || []).filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const thisMonthExpenses = (cashTransactions || []).filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const lastMonthIncome = (lastMonthInvoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // حساب النمو
      const incomeGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
      const expenseGrowth = 0; // يمكن حسابه لاحقاً

      const summary = {
        currentBalance: currentBalance?.[0]?.current_balance || 0,
        thisMonthIncome,
        thisMonthExpenses,
        thisMonthNetFlow: thisMonthIncome - thisMonthExpenses,
        incomeGrowth,
        expenseGrowth
      };

      setFinancialSummary(summary);
    } catch (error) {
      logger.error('خطأ في تحديث البيانات المالية:', error, 'CashFlowDashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    
    // تحديث تلقائي كل دقيقتين
    const interval = setInterval(refreshData, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return formatCurrencyEnglish(amount, "ج.م");
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-4 w-4" />;
    if (growth < 0) return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  if (isLoading || !financialSummary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  // بيانات الرسم البياني (سيتم تحديثها لاحقاً لجلب البيانات من Supabase)
  const chartData = [
    { date: 'اليوم', income: financialSummary?.thisMonthIncome || 0, expenses: financialSummary?.thisMonthExpenses || 0, net: financialSummary?.thisMonthNetFlow || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* بطاقات الملخص المالي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* الرصيد الحالي */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الرصيد الحالي</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${
              financialSummary.currentBalance < 0 ? 'text-red-600' : ''
            }`}>
              {formatCurrency(financialSummary.currentBalance)}
            </div>
            <div className={`flex items-center text-xs mt-1 font-tajawal ${
              financialSummary.currentBalance > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {financialSummary.currentBalance > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {financialSummary.currentBalance > 0 ? 'رصيد إيجابي' : 'رصيد سالب'}
            </div>
          </CardContent>
        </Card>

        {/* إيرادات الشهر */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إيرادات الشهر</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">
              {formatCurrency(financialSummary.thisMonthIncome)}
            </div>
            <div className={`flex items-center text-xs mt-1 font-tajawal ${getGrowthColor(financialSummary.incomeGrowth)}`}>
              {getGrowthIcon(financialSummary.incomeGrowth)}
              {formatNumberEnglish(Math.abs(financialSummary.incomeGrowth), 0)}% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        {/* مصروفات الشهر */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">مصروفات الشهر</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 font-tajawal">
              {formatCurrency(financialSummary.thisMonthExpenses)}
            </div>
            <div className={`flex items-center text-xs mt-1 font-tajawal ${getGrowthColor(-financialSummary.expenseGrowth)}`}>
              {getGrowthIcon(financialSummary.expenseGrowth)}
              {formatNumberEnglish(Math.abs(financialSummary.expenseGrowth), 0)}% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        {/* صافي التدفق */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">صافي التدفق</CardTitle>
            <div className="flex items-center gap-2">
              {financialSummary.thisMonthNetFlow > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${
              financialSummary.thisMonthNetFlow > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(financialSummary.thisMonthNetFlow)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {financialSummary.thisMonthNetFlow > 0 ? 'ربح هذا الشهر' : 'خسارة هذا الشهر'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية والتفاصيل */}
      <Tabs defaultValue="flow" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="flow" className="font-cairo">نظرة عامة</TabsTrigger>
            <TabsTrigger value="transactions" className="font-cairo">التقارير</TabsTrigger>
            <TabsTrigger value="alerts" className="font-cairo">التحليلات</TabsTrigger>
          </TabsList>
          
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">التدفق النقدي - آخر 7 أيام</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `التاريخ: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="الإيرادات"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="المصروفات"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="صافي التدفق"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-cairo">المعاملات (0)</CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4 font-cairo">
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-lg font-bold font-tajawal">
                    {financialSummary?.thisMonthIncome > 0 || financialSummary?.thisMonthExpenses > 0 ? 
                      'تقرير مالي شامل' : 'لا توجد معاملات مطابقة للفلاتر المحددة'
                    }
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-tajawal">
                      {formatNumberEnglish(financialSummary?.thisMonthExpenses || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground font-cairo">مصروفات الشهر</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-tajawal">
                      {formatNumberEnglish(financialSummary?.thisMonthIncome || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground font-cairo">إيرادات الشهر</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm font-tajawal">
                  <div className="flex justify-between">
                    <span>إيرادات الشهر:</span>
                    <span>{formatCurrency(financialSummary?.thisMonthIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مصروفات الشهر:</span>
                    <span>{formatCurrency(financialSummary?.thisMonthExpenses || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الرصيد الحالي:</span>
                    <span>{formatCurrency(financialSummary?.currentBalance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>صافي التدفق الشهري:</span>
                    <span>{formatCurrency(financialSummary?.thisMonthNetFlow || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>نسبة النمو:</span>
                    <span>{formatNumberEnglish(financialSummary?.incomeGrowth || 0)}%</span>
                  </div>
                </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-bold font-cairo">مؤشر الأداء العام</h4>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-cairo">ضعيف</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-cairo">متوسط</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-cairo">ممتاز</span>
                      </div>
                      
                      <div className="space-y-2 text-sm font-tajawal">
                        <div className="flex justify-between">
                          <span>نسبة المبيعات من إجمالي الدخل</span>
                          <span>0%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>نسبة المصاريف التشغيلية</span>
                          <span>0%</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800 font-tajawal">
                          <span>⚠️</span>
                          <span className="font-bold">بناء احتياطي نقدي</span>
                        </div>
                        <div className="text-sm text-yellow-600 mt-1 font-tajawal">
                          يُنصح ببناء احتياطي نقدي لا يقل عن 10,000 جنيه لضمان السيولة.
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm font-tajawal">
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {formatCurrency(Math.max(financialSummary?.thisMonthIncome || 0, financialSummary?.thisMonthExpenses || 0))}
                          </div>
                          <div className="text-muted-foreground">أعلى قيمة</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {formatCurrency((financialSummary?.thisMonthIncome || 0) / 30)}
                          </div>
                          <div className="text-muted-foreground">متوسط يومي</div>
                        </div>
                      </div>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <AlertTriangle className="h-5 w-5" />
                تحليل النشاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-cairo">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">تقرير الأداء المالي</h4>
                    <div className="text-sm text-muted-foreground">تحليل شامل للوضع المالي الحالي</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">مقارنة الدخل والمصروفات</h4>
                    <div className="text-sm text-muted-foreground">رسوم بيانية تفاعلية للمقارنة</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">إحصائيات متقدمة</h4>
                    <div className="text-sm text-muted-foreground">تحليل عميق للبيانات المالية</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-bold text-lg mb-3">توصيات ذكية</h4>
                    <div className="text-sm text-muted-foreground">نصائح لتحسين الأداء المالي</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}