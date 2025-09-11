import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Plus, 
  Minus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  History,
  Wallet,
  RefreshCw,
  Download,
  AlertTriangle,
  Edit2,
  Trash2,
  RotateCcw,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Zap
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCashRegister } from '@/hooks/useCashRegister';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from 'recharts';
import jsPDF from 'jspdf';

interface TransactionFormData {
  transaction_type: 'income' | 'expense';
  amount: string;
  description: string;
  category: string;
  subcategory: string;
  payment_method: 'cash' | 'bank' | 'credit' | 'check';
  notes: string;
}

export default function CashRegisterSupabase() {
  const navigate = useNavigate();
  const {
    transactions,
    currentBalance,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreDeletedTransactions,
    getDeletedTransactions,
    permanentDeleteTransaction,
    permanentDeleteAllTransactions,
    getCashStatistics,
    cleanupOrphanedInvoiceTransactions,
    syncExistingInventoryWithCash,
    refreshData
  } = useCashRegister();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('income');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [deletedTransactions, setDeletedTransactions] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('30days'); // 7days, 30days, 3months, 6months
  const [showCharts, setShowCharts] = useState(false);
  
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'income',
    amount: '',
    description: '',
    category: '',
    subcategory: '',
    payment_method: 'cash',
    notes: ''
  });

  const incomeCategories = [
    { value: 'sales', label: 'مبيعات' },
    { value: 'services', label: 'خدمات' },
    { value: 'other', label: 'دخل آخر' },
    { value: 'deposit', label: 'إيداع' }
  ];

  const expenseCategories = [
    { value: 'withdrawal', label: 'سحب' },
    { value: 'purchases', label: 'مشتريات' },
    { value: 'utilities', label: 'فواتير' },
    { value: 'rent', label: 'إيجار' },
    { value: 'payroll', label: 'رواتب' },
    { value: 'marketing', label: 'تسويق' },
    { value: 'other', label: 'مصروف آخر' }
  ];

  // دوال التحليل والإحصائيات
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (dateFilter) {
      case '7days':
        startDate = subDays(endDate, 7);
        break;
      case '30days':
        startDate = subDays(endDate, 30);
        break;
      case '3months':
        startDate = subDays(endDate, 90);
        break;
      case '6months':
        startDate = subDays(endDate, 180);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    return { startDate, endDate };
  };

  const getFilteredTransactions = () => {
    const { startDate, endDate } = getDateRange();
    return transactions.filter(t => {
      const transactionDate = new Date(t.created_at || '');
      return isWithinInterval(transactionDate, { start: startDate, end: endDate });
    });
  };

  const getExpenseChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    const expenses = filteredTransactions.filter(t => t.transaction_type === 'expense');
    
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(t => {
      const categoryLabel = expenseCategories.find(cat => cat.value === t.category)?.label || t.category;
      categoryTotals[categoryLabel] = (categoryTotals[categoryLabel] || 0) + t.amount;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  };

  const getIncomeChartData = () => {
    const filteredTransactions = getFilteredTransactions();
    const income = filteredTransactions.filter(t => t.transaction_type === 'income');
    
    const categoryTotals: { [key: string]: number } = {};
    income.forEach(t => {
      const categoryLabel = incomeCategories.find(cat => cat.value === t.category)?.label || t.category;
      categoryTotals[categoryLabel] = (categoryTotals[categoryLabel] || 0) + t.amount;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  };

  const getAnalyticsData = () => {
    const filteredTransactions = getFilteredTransactions();
    const expenses = filteredTransactions.filter(t => t.transaction_type === 'expense');
    const income = filteredTransactions.filter(t => t.transaction_type === 'income');
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    // أكبر مصروف
    const largestExpense = expenses.length > 0 
      ? expenses.reduce((max, t) => t.amount > max.amount ? t : max)
      : null;
    
    // أكبر إيداع
    const largestIncome = income.length > 0 
      ? income.reduce((max, t) => t.amount > max.amount ? t : max)
      : null;
    
    // متوسط المصروفات اليومية
    const { startDate, endDate } = getDateRange();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDailyExpense = daysDiff > 0 ? totalExpenses / daysDiff : 0;
    
    return {
      totalExpenses,
      totalIncome,
      netFlow: totalIncome - totalExpenses,
      largestExpense,
      largestIncome,
      averageDailyExpense,
      incomeToExpenseRatio: totalExpenses > 0 ? (totalIncome / totalExpenses) * 100 : 0
    };
  };

  // دالة لترجمة الفئات
  const getCategoryLabel = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      const found = incomeCategories.find(cat => cat.value === category);
      return found ? found.label : category;
    } else {
      const found = expenseCategories.find(cat => cat.value === category);
      return found ? found.label : category;
    }
  };

  // دالة لترجمة طريقة الدفع
  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'نقدي',
      'bank': 'تحويل بنكي',
      'credit': 'بطاقة ائتمان',
      'check': 'شيك'
    };
    return methods[method] || method;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      return;
    }

    try {
      if (editingTransaction) {
        // تحديث معاملة موجودة
        await updateTransaction(editingTransaction, {
          transaction_type: formData.transaction_type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          payment_method: formData.payment_method,
          notes: formData.notes || undefined
        });
      } else {
        // إضافة معاملة جديدة
        await addTransaction({
          transaction_type: formData.transaction_type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          payment_method: formData.payment_method,
          notes: formData.notes || undefined
        });
      }

      // إعادة تعيين النموذج
      setFormData({
        transaction_type: 'income',
        amount: '',
        description: '',
        category: '',
        subcategory: '',
        payment_method: 'cash',
        notes: ''
      });
      
      setEditingTransaction(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('خطأ في المعاملة:', error);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setFormData({
      transaction_type: transaction.transaction_type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      subcategory: transaction.subcategory || '',
      payment_method: transaction.payment_method,
      notes: transaction.notes || ''
    });
    setEditingTransaction(transaction.id);
    setIsAddDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟ (يمكن استعادتها خلال 30 يوم)')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('خطأ في حذف المعاملة:', error);
      }
    }
  };

  const handleOpenRestoreDialog = async () => {
    const deletedData = await getDeletedTransactions();
    setDeletedTransactions(deletedData);
    setIsRestoreDialogOpen(true);
  };

  const handleRestoreTransaction = async (transactionId: string) => {
    // استعادة معاملة محددة - يمكن تطوير هذا لاحقاً إذا كان متاحاً في السيرفر
    await restoreDeletedTransactions();
    
    // تحديث قائمة المعاملات المحذوفة
    const updatedDeletedData = await getDeletedTransactions();
    setDeletedTransactions(updatedDeletedData);
    
    // إغلاق الـ dialog إذا لم تعد هناك معاملات محذوفة
    if (updatedDeletedData.length === 0) {
      setIsRestoreDialogOpen(false);
    }
  };

  const handlePermanentDeleteTransaction = async (transactionId: string) => {
    const success = await permanentDeleteTransaction(transactionId);
    if (success) {
      // تحديث قائمة المعاملات المحذوفة
      const updatedDeletedData = await getDeletedTransactions();
      setDeletedTransactions(updatedDeletedData);
      
      // إغلاق الـ dialog إذا لم تعد هناك معاملات محذوفة
      if (updatedDeletedData.length === 0) {
        setIsRestoreDialogOpen(false);
      }
    }
  };

  const handlePermanentDeleteAllTransactions = async () => {
    const success = await permanentDeleteAllTransactions();
    if (success) {
      // تحديث قائمة المعاملات المحذوفة
      const updatedDeletedData = await getDeletedTransactions();
      setDeletedTransactions(updatedDeletedData);
      
      // إغلاق الـ dialog إذا لم تعد هناك معاملات محذوفة
      if (updatedDeletedData.length === 0) {
        setIsRestoreDialogOpen(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en', {
      minimumFractionDigits: 0
    }).format(amount) + ' ج.م.';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'income' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  // دالة تصدير المعاملات كـ PDF بنفس تصميم عرض المنتجات
  const handleExportTransactionsPDF = () => {
    if (transactions.length === 0) {
      alert("لا توجد معاملات للتصدير");
      return;
    }

    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    // الحصول على المعاملات المفلترة
    const filteredTransactions = getFilteredTransactions();
    const analytics = getAnalyticsData();

    // إعداد صفوف الجدول
    const rows = filteredTransactions.map(transaction => {
      const date = transaction.created_at ? format(new Date(transaction.created_at), 'dd/MM/yyyy') : 'غير محدد';
      const categoryLabel = getCategoryLabel(transaction.category, transaction.transaction_type);
      const paymentMethodLabel = getPaymentMethodLabel(transaction.payment_method);
      const typeLabel = transaction.transaction_type === 'income' ? 'دخل' : 'مصروف';
      const amountDisplay = transaction.transaction_type === 'income' 
        ? `+${formatCurrency(transaction.amount)}`
        : `-${formatCurrency(transaction.amount)}`;
      
      return `
        <tr>
          <td>${date}</td>
          <td>${transaction.description}</td>
          <td>${categoryLabel}</td>
          <td>${paymentMethodLabel}</td>
          <td class="${transaction.transaction_type === 'income' ? 'income' : 'expense'}">${amountDisplay}</td>
          <td>${typeLabel}</td>
        </tr>
      `;
    });

    // الفترة الزمنية
    const dateFilterLabels = {
      '7days': 'آخر 7 أيام',
      '30days': 'آخر 30 يوم',
      '3months': 'آخر 3 أشهر',
      '6months': 'آخر 6 أشهر'
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير معاملات الصندوق</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            direction: rtl; 
            margin: 20px;
            color: #333;
          }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .section { margin: 30px 0; }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            border-bottom: 2px solid #333; 
            padding-bottom: 5px; 
            margin-bottom: 15px; 
          }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .stat-item { display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px; }
          .stat-label { font-weight: bold; }
          .stat-value { color: #333; }
          .balance { font-size: 20px; font-weight: bold; color: #2563eb; text-align: center; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .income { color: #16a34a; font-weight: bold; }
          .expense { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير معاملات الصندوق</h1>
          <div class="subtitle">سجل شامل لجميع المعاملات المالية</div>
          <div class="info">
            <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
            <div>الفترة الزمنية: ${dateFilterLabels[dateFilter] || dateFilter}</div>
            <div>عدد المعاملات: ${filteredTransactions.length}</div>
          </div>
          <div class="balance">الرصيد الحالي: <span style="color: ${currentBalance < 0 ? '#dc2626' : '#2563eb'}">${formatCurrency(currentBalance)}</span></div>
        </div>

        <div class="section">
          <h2 class="section-title">الملخص الإحصائي</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">إجمالي الدخل:</span>
              <span class="stat-value income">${formatCurrency(analytics.totalIncome)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">إجمالي المصروفات:</span>
              <span class="stat-value expense">${formatCurrency(analytics.totalExpenses)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">صافي التدفق:</span>
              <span class="stat-value ${analytics.netFlow >= 0 ? 'income' : 'expense'}">${formatCurrency(analytics.netFlow)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">متوسط المصروف اليومي:</span>
              <span class="stat-value">${formatCurrency(analytics.averageDailyExpense)}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">سجل المعاملات</h2>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>الفئة</th>
                <th>طريقة الدفع</th>
                <th>المبلغ</th>
                <th>النوع</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الصندوق</p>
          <p>تاريخ الإنشاء: ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 p-6">
      {/* رأس الصفحة */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-cairo text-foreground">الصندوق</h1>
            <p className="text-muted-foreground font-tajawal">إدارة المعاملات النقدية اليومية</p>
          </div>
          
          {/* مجموعة التحليلات والفلاتر */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setShowCharts(!showCharts)} variant="outline" className="font-tajawal">
              <BarChart3 className="h-4 w-4 ml-2" />
              {showCharts ? 'إخفاء التحليلات' : 'عرض التحليلات'}
            </Button>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days" className="font-tajawal">آخر 7 أيام</SelectItem>
                <SelectItem value="30days" className="font-tajawal">آخر 30 يوم</SelectItem>
                <SelectItem value="3months" className="font-tajawal">آخر 3 أشهر</SelectItem>
                <SelectItem value="6months" className="font-tajawal">آخر 6 أشهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* شريط الأدوات */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={refreshData} variant="outline" disabled={isLoading} className="font-tajawal">
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button 
            onClick={cleanupOrphanedInvoiceTransactions} 
            variant="secondary" 
            disabled={isLoading}
            className="font-tajawal"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            تنظيف البيانات
          </Button>
          <Button 
            onClick={() => syncExistingInventoryWithCash()} 
            variant="outline" 
            disabled={isLoading}
            className="font-tajawal"
          >
            <Zap className="h-4 w-4 ml-2" />
            مزامنة المخزون
          </Button>
          <Button 
            onClick={handleOpenRestoreDialog} 
            variant="destructive" 
            className="font-tajawal"
          >
            <FileText className="h-4 w-4 ml-2" />
            استعادة المعاملات المحذوفة
          </Button>
        </div>
      </div>

      {/* بطاقة الرصيد الحالي */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-tajawal">الرصيد الحالي</p>
              <p className={`text-3xl font-bold font-tajawal ${currentBalance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التحليلات والرسوم البيانية */}
      {showCharts && (
        <>
          {/* بطاقات التحليل السريع */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(() => {
              const analytics = getAnalyticsData();
              return (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-tajawal">إجمالي الدخل</span>
                      </div>
                      <p className="text-lg font-bold text-green-600 font-tajawal">
                        {formatCurrency(analytics.totalIncome)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-tajawal">إجمالي المصروفات</span>
                      </div>
                      <p className="text-lg font-bold text-red-600 font-tajawal">
                        {formatCurrency(analytics.totalExpenses)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-tajawal">صافي التدفق</span>
                      </div>
                      <p className={`text-lg font-bold font-tajawal ${
                        analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(analytics.netFlow)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-tajawal">متوسط يومي</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600 font-tajawal">
                        {formatCurrency(analytics.averageDailyExpense)}
                      </p>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>

          {/* الرسوم البيانية */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* رسم المصروفات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <PieChart className="h-5 w-5 text-red-600" />
                  توزيع المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const expenseData = getExpenseChartData();
                  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
                  
                  return expenseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                         <Pie
                           data={expenseData}
                           cx="50%"
                           cy="50%"
                           labelLine={true}
                           label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                           outerRadius={85}
                           innerRadius={30}
                           paddingAngle={2}
                           fill="#8884d8"
                           dataKey="value"
                         >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <p className="font-tajawal">لا توجد مصروفات في هذه الفترة</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* رسم الإيرادات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <PieChart className="h-5 w-5 text-green-600" />
                  توزيع الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const incomeData = getIncomeChartData();
                  const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308'];
                  
                  return incomeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                         <Pie
                           data={incomeData}
                           cx="50%"
                           cy="50%"
                           labelLine={true}
                           label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                           outerRadius={85}
                           innerRadius={30}
                           paddingAngle={2}
                           fill="#8884d8"
                           dataKey="value"
                         >
                          {incomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <p className="font-tajawal">لا توجد إيرادات في هذه الفترة</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* إحصائيات تفصيلية */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-cairo">أكبر المعاملات</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const analytics = getAnalyticsData();
                  return (
                    <div className="space-y-4">
                      {analytics.largestExpense && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium font-tajawal">أكبر مصروف</span>
                          </div>
                          <p className="font-bold text-red-600 font-tajawal">
                            {formatCurrency(analytics.largestExpense.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground font-tajawal">
                            {analytics.largestExpense.description}
                          </p>
                        </div>
                      )}
                      
                      {analytics.largestIncome && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium font-tajawal">أكبر إيداع</span>
                          </div>
                          <p className="font-bold text-green-600 font-tajawal">
                            {formatCurrency(analytics.largestIncome.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground font-tajawal">
                            {analytics.largestIncome.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-cairo">نسب مالية</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const analytics = getAnalyticsData();
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-tajawal">نسبة الدخل إلى المصروفات</span>
                        <Badge variant={analytics.incomeToExpenseRatio >= 100 ? "default" : "destructive"} className="font-tajawal">
                          {analytics.incomeToExpenseRatio.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-tajawal">عدد المعاملات</span>
                        <Badge variant="secondary" className="font-tajawal">
                          {getFilteredTransactions().length}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-tajawal">الفترة المحددة</span>
                        <Badge variant="outline" className="font-tajawal">
                          {dateFilter === '7days' && 'آخر 7 أيام'}
                          {dateFilter === '30days' && 'آخر 30 يوم'}
                          {dateFilter === '3months' && 'آخر 3 أشهر'}
                          {dateFilter === '6months' && 'آخر 6 أشهر'}
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* إضافة معاملة جديدة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <Plus className="h-5 w-5" />
              إضافة معاملة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full font-cairo" onClick={() => {
                  setEditingTransaction(null);
                  setFormData({
                    transaction_type: 'income',
                    amount: '',
                    description: '',
                    category: '',
                    subcategory: '',
                    payment_method: 'cash',
                    notes: ''
                  });
                }}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة معاملة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-cairo">
                    {editingTransaction ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* نوع المعاملة */}
                  <div>
                    <Label className="font-tajawal">نوع المعاملة</Label>
                    <Select
                      value={formData.transaction_type}
                      onValueChange={(value: 'income' | 'expense') =>
                        setFormData({ ...formData, transaction_type: value, category: '' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income" className="font-tajawal">دخل 💰</SelectItem>
                        <SelectItem value="expense" className="font-tajawal">مصروف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* المبلغ */}
                  <div>
                    <Label className="font-tajawal">المبلغ (جنيه)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="font-tajawal"
                      required
                    />
                  </div>

                  {/* الوصف */}
                  <div>
                    <Label className="font-tajawal">الوصف</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف تفصيلي للعملية"
                      className="font-tajawal"
                      required
                    />
                  </div>

                  {/* الفئة */}
                  <div>
                    <Label className="font-tajawal">الفئة</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" className="font-tajawal" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.transaction_type === 'income'
                          ? incomeCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="font-tajawal">
                                {cat.label}
                              </SelectItem>
                            ))
                          : expenseCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="font-tajawal">
                                {cat.label}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* الفئة الفرعية */}
                  <div>
                    <Label className="font-tajawal">الفئة الفرعية (اختياري)</Label>
                    <Input
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="فئة فرعية"
                      className="font-tajawal"
                    />
                  </div>

                  {/* طريقة الدفع */}
                  <div>
                    <Label className="font-tajawal">طريقة الدفع</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value: 'cash' | 'bank' | 'credit' | 'check') =>
                        setFormData({ ...formData, payment_method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue className="font-tajawal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="font-tajawal">نقدي</SelectItem>
                        <SelectItem value="bank" className="font-tajawal">تحويل بنكي</SelectItem>
                        <SelectItem value="credit" className="font-tajawal">بطاقة ائتمان</SelectItem>
                        <SelectItem value="check" className="font-tajawal">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ملاحظات */}
                  <div>
                    <Label className="font-tajawal">ملاحظات (اختياري)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ملاحظات إضافية"
                      className="font-tajawal"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading} className="flex-1 font-cairo">
                      {isLoading ? 'جاري الحفظ...' : (editingTransaction ? 'تحديث' : 'حفظ')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingTransaction(null);
                      }}
                      className="flex-1 font-cairo"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* الإحصائيات السريعة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <DollarSign className="h-5 w-5" />
              الإحصائيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-tajawal">إجمالي المعاملات</span>
                <Badge variant="secondary" className="font-tajawal">{transactions.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-tajawal">هذا الشهر - دخل</span>
                <span className="text-green-600 font-medium font-tajawal">
                  {formatCurrency(
                    transactions
                      .filter(t => 
                        t.transaction_type === 'income' && 
                        new Date(t.created_at || '').getMonth() === new Date().getMonth()
                      )
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-tajawal">هذا الشهر - مصروفات</span>
                <span className="text-red-600 font-medium font-tajawal">
                  {formatCurrency(
                    transactions
                      .filter(t => 
                        t.transaction_type === 'expense' && 
                        new Date(t.created_at || '').getMonth() === new Date().getMonth()
                      )
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المعاملات الحديثة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-cairo">
              <History className="h-5 w-5" />
              المعاملات الحديثة
            </CardTitle>
            <Button
              onClick={handleExportTransactionsPDF}
              variant="outline"
              size="sm"
              className="font-tajawal"
              disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="font-tajawal">جاري التحميل...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="font-tajawal">لا توجد معاملات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                   <div className="flex items-center gap-3">
                     {getTransactionTypeIcon(transaction.transaction_type)}
                     <div>
                       <p className="font-medium font-tajawal">{transaction.description}</p>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground font-tajawal">
                         <Badge variant="outline" className="text-xs font-tajawal">
                           {getCategoryLabel(transaction.category, transaction.transaction_type)}
                         </Badge>
                         <span>•</span>
                         <span>{getPaymentMethodLabel(transaction.payment_method)}</span>
                         {transaction.created_at && (
                           <>
                             <span>•</span>
                             <span>{format(new Date(transaction.created_at), 'PPP', { locale: ar })}</span>
                           </>
                         )}
                       </div>
                     </div>
                   </div>
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <p className={`font-bold font-tajawal ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTransaction(transaction)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                      >
                        <Edit2 className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTransaction(transaction.id!)}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Deleted Transactions Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">استعادة المعاملات المحذوفة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deletedTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-tajawal">لا توجد معاملات محذوفة</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-tajawal mb-4">
                  يمكنك استعادة المعاملات المحذوفة أو حذفها نهائياً
                </p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-cairo">النوع</TableHead>
                        <TableHead className="text-right font-cairo">الوصف</TableHead>
                        <TableHead className="text-right font-cairo">المبلغ</TableHead>
                        <TableHead className="text-right font-cairo">الفئة</TableHead>
                        <TableHead className="text-right font-cairo">التاريخ</TableHead>
                        <TableHead className="text-right font-cairo">تاريخ الحذف</TableHead>
                        <TableHead className="text-center font-cairo">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-right">
                            <Badge variant={transaction.transaction_type === 'income' ? 'default' : 'destructive'} className="font-tajawal">
                              {transaction.transaction_type === 'income' ? 'دخل' : 'مصروف'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-tajawal">{transaction.description}</TableCell>
                          <TableCell className="font-mono text-right">
                            {transaction.amount?.toLocaleString('ar-SA')} ج.م
                          </TableCell>
                          <TableCell className="font-tajawal">{transaction.category}</TableCell>
                          <TableCell className="font-tajawal">
                            {transaction.created_at 
                              ? format(new Date(transaction.created_at), "dd/MM/yyyy", { locale: ar })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="font-tajawal">
                            {transaction.deleted_at 
                              ? format(new Date(transaction.deleted_at), "dd/MM/yyyy HH:mm", { locale: ar })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleRestoreTransaction(transaction.id)}
                                className="font-cairo"
                              >
                                استعادة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من حذف هذه المعاملة نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                                    handlePermanentDeleteTransaction(transaction.id);
                                  }
                                }}
                                className="font-cairo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-6">
              {deletedTransactions.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف جميع المعاملات المحذوفة نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                      handlePermanentDeleteAllTransactions();
                    }
                  }}
                  className="font-cairo"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف جميع المعاملات نهائياً
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsRestoreDialogOpen(false)}
                className="font-cairo"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}