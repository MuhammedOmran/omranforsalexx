import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface ExpenseAnalyticsProps {
  expenses: any[];
  period?: 'month' | 'quarter' | 'year';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function ExpenseAnalytics({ expenses, period = 'month' }: ExpenseAnalyticsProps) {
  // حساب الإحصائيات
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

  // تجميع المصروفات حسب الفئة
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryBreakdown).map(([category, amount]) => ({
    category,
    amount: amount as number,
    percentage: totalExpenses > 0 ? (((amount as number) / totalExpenses) * 100).toFixed(1) : '0'
  }));

  // بيانات الاتجاه الشهري
  const monthlyTrend = expenses.reduce((acc, exp) => {
    const month = new Date(exp.date).toLocaleDateString('ar-EG', { month: 'short' });
    acc[month] = (acc[month] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.entries(monthlyTrend).map(([month, amount]) => ({
    month,
    amount
  }));

  // احصائيات متقدمة
  const avgDailyExpense = totalExpenses / 30; // متوسط يومي
  const highestExpense = Math.max(...expenses.map(e => e.amount));
  const expenseCount = expenses.length;

  // تحليل النمو
  const currentMonth = new Date().getMonth();
  const currentMonthExpenses = expenses.filter(e => new Date(e.date).getMonth() === currentMonth);
  const lastMonthExpenses = expenses.filter(e => new Date(e.date).getMonth() === currentMonth - 1);
  
  const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const growthRate = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* كروت الإحصائيات المحسنة */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المصروفات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalExpenses.toLocaleString()} ج.م</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {growthRate > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500 ml-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500 ml-1" />
              )}
              <span className={`${growthRate > 0 ? 'text-red-500' : 'text-green-500'} font-tajawal`}>
                {Math.abs(growthRate).toFixed(1)}% من الشهر الماضي
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">متوسط يومي</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{avgDailyExpense.toFixed(0)} ج.م</div>
            <p className="text-xs text-muted-foreground font-tajawal">متوسط الإنفاق اليومي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">أعلى مصروف</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{highestExpense.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground font-tajawal">أكبر مصروف مسجل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">عدد المصروفات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{expenseCount}</div>
            <Progress value={(paidExpenses / totalExpenses) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1 font-tajawal">
              {((paidExpenses / totalExpenses) * 100).toFixed(1)}% مدفوع
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* توزيع المصروفات حسب الفئة */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">توزيع المصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({category, percentage}) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'المبلغ']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full ml-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.percentage}%</Badge>
                    <span className="font-medium">{item.amount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* الاتجاه الشهري */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">اتجاه المصروفات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'المصروفات']} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* مقارنة الفئات */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">مقارنة المصروفات حسب الفئة</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'المبلغ']} />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}