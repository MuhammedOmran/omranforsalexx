import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";
import { cashFlowManager } from "@/utils/cashFlowManager";
import { inventoryManager } from "@/utils/inventoryUtils";
import { 
  Plus, 
  Minus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  History,
  Calendar,
  Wallet,
  RefreshCw,
  Filter,
  Download,
  Search,
  AlertTriangle,
  BarChart3,
  PieChart,
  FileText,
  Calculator,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import ExpenseIntegrationStatus from "@/components/cash/ExpenseIntegrationStatus";
import CashReports from "@/components/cash/CashReports";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  paymentMethod?: string;
  referenceId?: string;
  notes?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

export default function CashRegister() {
  // دالة تحويل أسماء الفئات
  const getCategoryDisplayName = (category: string) => {
    const displayNames: { [key: string]: string } = {
      'sales': 'مبيعات',
      'services': 'خدمات',
      'deposit': 'إيداع',
      'other_income': 'دخل آخر',
      'operational': 'مصاريف تشغيلية',
      'expenses': 'مصروف',
      'withdrawal': 'سحب',
      'rent': 'إيجار',
      'utilities': 'فواتير',
      'supplies': 'مواد',
      'other_expense': 'مصروف آخر'
    };
    return displayNames[category] || category;
  };

  const getCashFlowCategory = (category: string) => {
    const categoryMap: { [key: string]: any } = {
      'sales': 'sales',
      'services': 'other',
      'deposit': 'other',
      'other_income': 'other',
      'operational': 'utilities',
      'expenses': 'other',
      'withdrawal': 'other',
      'rent': 'rent',
      'utilities': 'utilities',
      'supplies': 'other',
      'other_expense': 'other'
    };
    return categoryMap[category] || 'other';
  };

  const { toast } = useToast();
  const [currentBalance, setCurrentBalance] = useState(() => {
    return storage.getItem<number>('currentBalance', 0);
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = storage.getItem<Transaction[]>('transactions', []);
    return saved.map((t: any) => ({
      ...t,
      date: new Date(t.date)
    }));
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [transactionForm, setTransactionForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    paymentMethod: 'cash',
    notes: ''
  });

  // مزامنة البيانات مع cashFlowManager
  const syncWithCashFlowManager = () => {
    setIsLoading(true);
    try {
      cashFlowManager.syncAllFinancialData();
      
      // تحديث الرصيد
      const newBalance = cashFlowManager.getCurrentBalance();
      setCurrentBalance(newBalance);
      storage.setItem('currentBalance', newBalance);
      
      // جلب المعاملات المحدثة
      const cashFlowTransactions = cashFlowManager.getTransactions();
      const convertedTransactions: Transaction[] = cashFlowTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        date: new Date(t.date),
        paymentMethod: t.paymentMethod,
        referenceId: t.referenceId,
        notes: t.notes
      }));
      
      setTransactions(convertedTransactions);
      storage.setItem('transactions', convertedTransactions);
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithCashFlowManager();
    
    // تحديث تلقائي كل دقيقة
    const interval = setInterval(syncWithCashFlowManager, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTransaction = () => {
    if (!transactionForm.amount || !transactionForm.description || !transactionForm.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (amount <= 0) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون المبلغ أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    const newTransaction: Transaction = {
      id: `TR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: transactionForm.type,
      amount,
      description: transactionForm.description,
      category: transactionForm.category,
      date: new Date(),
      paymentMethod: transactionForm.paymentMethod,
      notes: transactionForm.notes
    };

    // إضافة إلى النظام المحلي
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    storage.setItem('transactions', updatedTransactions);

    // تحديث الرصيد
    const newBalance = transactionForm.type === 'income' 
      ? currentBalance + amount 
      : currentBalance - amount;
    setCurrentBalance(newBalance);
    storage.setItem('currentBalance', newBalance);

    // ربط مع الأنظمة الأخرى
    linkWithOtherSystems(newTransaction);
    
    // ربط مع قسم المصروفات إذا كان النوع مصروف
    if (transactionForm.type === 'expense' && transactionForm.category === 'expenses') {
      linkWithExpensesSection(newTransaction);
    }

    // إعادة تعيين النموذج
    setTransactionForm({
      type: 'income',
      amount: '',
      description: '',
      category: '',
      paymentMethod: 'cash',
      notes: ''
    });
    setIsDialogOpen(false);

    toast({
      title: "تم بنجاح",
      description: `تم ${transactionForm.type === 'income' ? 'إضافة' : 'خصم'} ${amount.toLocaleString()} جنيه`,
    });
  };


  const linkWithOtherSystems = (transaction: Transaction) => {
    try {
      // إضافة المعاملة إلى التدفق النقدي مع تمييز المصدر
      const cashFlowTransaction = {
        date: transaction.date.toISOString().split('T')[0],
        type: transaction.type,
        category: getCashFlowCategory(transaction.category),
        subcategory: transaction.category,
        amount: transaction.amount,
        description: `[الصندوق] ${transaction.description}`,
        referenceId: transaction.id,
        referenceType: 'manual' as const,
        paymentMethod: transaction.paymentMethod as any,
        notes: transaction.notes,
        createdBy: 'مستخدم الصندوق',
        metadata: {
          sourceSystem: 'cash_register',
          originalCategory: transaction.category,
          manualEntry: true
        }
      };

      // تم إزالة الإضافة المكررة هنا

      // ربط مع المبيعات
      if (transaction.type === 'income' && transaction.category === 'sales') {
        linkWithSales(transaction);
      }

      // ربط مع المشتريات والموردين
      if (transaction.type === 'expense' && (transaction.category === 'operational' || transaction.category === 'supplies')) {
        linkWithPurchases(transaction);
      }

      // ربط مع الأقساط
      if (transaction.category === 'installments') {
        linkWithInstallments(transaction);
      }

      // ربط مع الشيكات
      if (transaction.paymentMethod === 'check') {
        linkWithChecks(transaction);
      }

      // ربط مع العملاء والموردين
      linkWithCustomersSuppliers(transaction);

      // ربط مع التقارير المالية
      linkWithFinancialReports(transaction);

      // ربط مع حسابات الموظفين
      if (transaction.category === 'payroll' || transaction.description.includes('راتب')) {
        linkWithEmployees(transaction);
      }

      // ربط مع المخزون
      if (transaction.category === 'sales' || transaction.category === 'supplies') {
        linkWithInventory(transaction);
      }

    } catch (error) {
      console.error('خطأ في ربط الأنظمة:', error);
    }
  };

  // ربط مع المبيعات
  const linkWithSales = (transaction: Transaction) => {
    try {
      const salesData = storage.getItem('sales_invoices', []);
      const customersData = storage.getItem('customers', []);
      
      // إنشاء فاتورة مبيعات تلقائية إذا لم توجد
      const newSaleInvoice = {
        id: `SALE_${transaction.id}`,
        customer: 'عميل نقدي',
        date: transaction.date.toISOString(),
        items: [{
          name: transaction.description,
          quantity: 1,
          price: transaction.amount,
          total: transaction.amount
        }],
        total: transaction.amount,
        paid: transaction.amount,
        remaining: 0,
        paymentMethod: transaction.paymentMethod,
        cashRegisterLinked: true,
        cashTransactionId: transaction.id,
        status: 'completed'
      };
      
      salesData.push(newSaleInvoice);
      storage.setItem('sales_invoices', salesData);
      
      // تحديث إحصائيات العملاء
      let cashCustomer = customersData.find((c: any) => c.name === 'عميل نقدي');
      if (!cashCustomer) {
        cashCustomer = {
          id: 'CASH_CUSTOMER',
          name: 'عميل نقدي',
          phone: '',
          email: '',
          address: '',
          totalPurchases: 0,
          createdAt: new Date().toISOString()
        };
        customersData.push(cashCustomer);
      }
      
      cashCustomer.totalPurchases += transaction.amount;
      storage.setItem('customers', customersData);
      
    } catch (error) {
      console.error('خطأ في ربط المبيعات:', error);
    }
  };

  // ربط مع المشتريات
  const linkWithPurchases = (transaction: Transaction) => {
    try {
      const purchasesData = storage.getItem('purchase_invoices', []);
      const suppliersData = storage.getItem('suppliers', []);
      
      const newPurchaseInvoice = {
        id: `PURCH_${transaction.id}`,
        supplier: 'مورد نقدي',
        date: transaction.date.toISOString(),
        items: [{
          name: transaction.description,
          quantity: 1,
          cost: transaction.amount,
          total: transaction.amount
        }],
        total: transaction.amount,
        paid: transaction.amount,
        remaining: 0,
        paymentMethod: transaction.paymentMethod,
        cashRegisterLinked: true,
        cashTransactionId: transaction.id,
        status: 'completed'
      };
      
      purchasesData.push(newPurchaseInvoice);
      storage.setItem('purchase_invoices', purchasesData);
      
      // تحديث إحصائيات الموردين
      let cashSupplier = suppliersData.find((s: any) => s.name === 'مورد نقدي');
      if (!cashSupplier) {
        cashSupplier = {
          id: 'CASH_SUPPLIER',
          name: 'مورد نقدي',
          phone: '',
          email: '',
          address: '',
          totalPurchases: 0,
          createdAt: new Date().toISOString()
        };
        suppliersData.push(cashSupplier);
      }
      
      cashSupplier.totalPurchases += transaction.amount;
      storage.setItem('suppliers', suppliersData);
      
    } catch (error) {
      console.error('خطأ في ربط المشتريات:', error);
    }
  };

  // ربط مع الأقساط
  const linkWithInstallments = (transaction: Transaction) => {
    try {
      const installmentsData = storage.getItem('installments', []);
      
      const newInstallment = {
        id: `INST_${transaction.id}`,
        customerName: transaction.description.includes('عميل') ? transaction.description : 'عميل نقدي',
        amount: transaction.amount,
        dueDate: transaction.date.toISOString(),
        status: transaction.type === 'income' ? 'paid' : 'pending',
        paymentDate: transaction.type === 'income' ? transaction.date.toISOString() : null,
        paymentMethod: transaction.paymentMethod,
        notes: transaction.notes,
        cashRegisterLinked: true,
        cashTransactionId: transaction.id
      };
      
      installmentsData.push(newInstallment);
      storage.setItem('installments', installmentsData);
      
    } catch (error) {
      console.error('خطأ في ربط الأقساط:', error);
    }
  };

  // ربط مع الشيكات
  const linkWithChecks = (transaction: Transaction) => {
    try {
      const checksData = storage.getItem('checks', []);
      
      const newCheck = {
        id: `CHECK_${transaction.id}`,
        checkNumber: `CHK_${Date.now()}`,
        amount: transaction.amount,
        date: transaction.date.toISOString(),
        dueDate: transaction.date.toISOString(),
        bankName: 'بنك نقدي',
        status: transaction.type === 'income' ? 'received' : 'issued',
        type: transaction.type === 'income' ? 'incoming' : 'outgoing',
        notes: transaction.notes,
        cashRegisterLinked: true,
        cashTransactionId: transaction.id
      };
      
      checksData.push(newCheck);
      storage.setItem('checks', checksData);
      
    } catch (error) {
      console.error('خطأ في ربط الشيكات:', error);
    }
  };

  // ربط مع العملاء والموردين
  const linkWithCustomersSuppliers = (transaction: Transaction) => {
    try {
      if (transaction.type === 'income') {
        // تحديث سجلات العملاء
        const customersData = storage.getItem('customers', []);
        const customerName = transaction.description.includes('عميل') ? 
          transaction.description.split('عميل')[1]?.trim() || 'عميل نقدي' : 'عميل نقدي';
          
        let customer = customersData.find((c: any) => c.name === customerName);
        if (!customer) {
          customer = {
            id: `CUST_${Date.now()}`,
            name: customerName,
            totalPurchases: 0,
            createdAt: new Date().toISOString()
          };
          customersData.push(customer);
        }
        
        customer.totalPurchases += transaction.amount;
        customer.lastTransaction = transaction.date.toISOString();
        storage.setItem('customers', customersData);
      } else {
        // تحديث سجلات الموردين
        const suppliersData = storage.getItem('suppliers', []);
        const supplierName = transaction.description.includes('مورد') ? 
          transaction.description.split('مورد')[1]?.trim() || 'مورد نقدي' : 'مورد نقدي';
          
        let supplier = suppliersData.find((s: any) => s.name === supplierName);
        if (!supplier) {
          supplier = {
            id: `SUPP_${Date.now()}`,
            name: supplierName,
            totalPurchases: 0,
            createdAt: new Date().toISOString()
          };
          suppliersData.push(supplier);
        }
        
        supplier.totalPurchases += transaction.amount;
        supplier.lastTransaction = transaction.date.toISOString();
        storage.setItem('suppliers', suppliersData);
      }
    } catch (error) {
      console.error('خطأ في ربط العملاء والموردين:', error);
    }
  };

  // ربط مع التقارير المالية
  const linkWithFinancialReports = (transaction: Transaction) => {
    try {
      const reportsData = storage.getItem('financial_reports', []);
      
      const reportEntry = {
        id: `RPT_${transaction.id}`,
        date: transaction.date.toISOString(),
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        source: 'cash_register',
        referenceId: transaction.id
      };
      
      reportsData.push(reportEntry);
      storage.setItem('financial_reports', reportsData);
      
    } catch (error) {
      console.error('خطأ في ربط التقارير:', error);
    }
  };

  // ربط مع الموظفين
  const linkWithEmployees = (transaction: Transaction) => {
    try {
      const employeesData = storage.getItem('employees', []);
      const payrollData = storage.getItem('payroll_records', []);
      
      if (transaction.type === 'expense' && (transaction.category === 'payroll' || transaction.description.includes('راتب'))) {
        const payrollRecord = {
          id: `PAY_${transaction.id}`,
          employeeName: transaction.description.includes('موظف') ? 
            transaction.description.split('موظف')[1]?.trim() || 'موظف' : 'موظف',
          amount: transaction.amount,
          date: transaction.date.toISOString(),
          type: 'salary',
          status: 'paid',
          paymentMethod: transaction.paymentMethod,
          notes: transaction.notes,
          cashRegisterLinked: true,
          cashTransactionId: transaction.id
        };
        
        payrollData.push(payrollRecord);
        storage.setItem('payroll_records', payrollData);
      }
    } catch (error) {
      console.error('خطأ في ربط الموظفين:', error);
    }
  };

  // ربط محسن مع المخزون
  const linkWithInventory = (transaction: Transaction) => {
    try {
      inventoryManager.addMovement({
        productId: transaction.category === 'sales' ? 'CASH_SALE' : 'CASH_PURCHASE',
        productName: transaction.description,
        code: `CASH_${transaction.id.slice(-6)}`,
        type: transaction.type === 'income' ? 'out' : 'in', // المبيعات = خروج، المشتريات = دخول
        quantity: 1,
        date: transaction.date.toISOString(),
        reason: `معاملة صندوق - ${getCategoryDisplayName(transaction.category)}`,
        value: transaction.amount,
        referenceType: 'adjustment',
        referenceId: transaction.id,
        notes: `${transaction.description} - ${transaction.notes || ''}`
      });
    } catch (error) {
      console.error('خطأ في ربط المخزون:', error);
    }
  };

  const linkWithExpensesSection = (transaction: Transaction) => {
    try {
      // ربط مع قسم المصروفات
      const expensesData = storage.getItem('expenses_records', []);
      const newExpense = {
        id: `EXP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: transaction.description,
        amount: transaction.amount,
        category: 'operational',
        date: transaction.date.toISOString(),
        description: transaction.notes || '',
        status: 'approved',
        paymentMethod: transaction.paymentMethod,
        cashRegisterLinked: true,
        cashTransactionId: transaction.id,
        createdAt: new Date().toISOString()
      };
      
      expensesData.push(newExpense);
      storage.setItem('expenses_records', expensesData);
      
      toast({
        title: "تم الربط",
        description: "تم ربط المعاملة مع قسم المصروفات بنجاح",
      });
    } catch (error) {
      console.error('خطأ في ربط قسم المصروفات:', error);
    }
  };

  // فلترة المعاملات
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesDateRange = transaction.date >= dateRange.from && transaction.date <= dateRange.to;
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // إحصائيات
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIncome - totalExpenses;

  // بيانات اليوم
  const todayTransactions = transactions.filter(
    t => t.date.toDateString() === new Date().toDateString()
  );

  const todayIncome = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpenses = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // بيانات الرسوم البيانية
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayTransactions = transactions.filter(
      t => t.date.toDateString() === date.toDateString()
    );
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    chartData.push({
      date: format(date, 'dd/MM'),
      income: dayIncome,
      expenses: dayExpenses,
      net: dayIncome - dayExpenses
    });
  }


  // بيانات فئات المصروفات
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { [key: string]: number }, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name: getCategoryDisplayName(name),
    value,
    percentage: ((value / totalExpenses) * 100).toFixed(1)
  }));

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount)} ج.م`;
  };

  // دالة تحويل الأرقام من العربية إلى الإنجليزية
  const formatCurrencyEnglish = (amount: number, currency: string = "ج.م") => {
    return `${amount.toLocaleString('en-US')} ${currency}`;
  };

  const formatNumberEnglish = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const exportData = () => {
    const csvData = filteredTransactions.map(t => ({
      'التاريخ': format(t.date, 'yyyy-MM-dd HH:mm'),
      'النوع': t.type === 'income' ? 'دخل' : 'مصروف',
      'المبلغ': t.amount,
      'الوصف': t.description,
      'الفئة': getCategoryDisplayName(t.category),
      'طريقة الدفع': t.paymentMethod || 'نقدي',
      'ملاحظات': t.notes || ''
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0] || {}).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cash_register_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات بنجاح",
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo text-foreground">مركز إدارة الصندوق</h1>
          <p className="text-muted-foreground mt-1 font-tajawal">
            إدارة شاملة للتدفق النقدي والمعاملات المالية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={syncWithCashFlowManager}
            disabled={isLoading}
            className="gap-2 font-cairo"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            مزامنة
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-cairo">
                <Plus className="h-4 w-4" />
                عملية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-cairo">إضافة عملية مالية جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-tajawal">نوع العملية</Label>
                    <Select
                      value={transactionForm.type}
                      onValueChange={(value: 'income' | 'expense') =>
                        setTransactionForm({ ...transactionForm, type: value })
                      }
                    >
                      <SelectTrigger className="font-tajawal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income" className="font-tajawal">دخل 💰</SelectItem>
                        <SelectItem value="expense" className="font-tajawal">مصروف 💸</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-tajawal">طريقة الدفع</Label>
                    <Select
                      value={transactionForm.paymentMethod}
                      onValueChange={(value) =>
                        setTransactionForm({ ...transactionForm, paymentMethod: value })
                      }
                    >
                      <SelectTrigger className="font-tajawal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="font-tajawal">نقدي</SelectItem>
                        <SelectItem value="bank" className="font-tajawal">بنكي</SelectItem>
                        <SelectItem value="credit" className="font-tajawal">بطاقة ائتمان</SelectItem>
                        <SelectItem value="check" className="font-tajawal">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">المبلغ (جنيه)</Label>
                  <Input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    step="0.01"
                    className="font-tajawal placeholder:font-tajawal"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">الوصف</Label>
                  <Input
                    value={transactionForm.description}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, description: e.target.value })
                    }
                    placeholder="وصف تفصيلي للعملية"
                    className="font-tajawal placeholder:font-tajawal"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">الفئة</Label>
                  <Select
                    value={transactionForm.category}
                    onValueChange={(value) =>
                      setTransactionForm({ ...transactionForm, category: value })
                    }
                  >
                    <SelectTrigger className="font-tajawal">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionForm.type === 'income' ? (
                        <>
                          <SelectItem value="sales" className="font-tajawal">مبيعات 🛒</SelectItem>
                          <SelectItem value="services" className="font-tajawal">خدمات 🔧</SelectItem>
                          <SelectItem value="deposit" className="font-tajawal">إيداع 💳</SelectItem>
                          <SelectItem value="other_income" className="font-tajawal">دخل آخر ➕</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="operational" className="font-tajawal">مصاريف تشغيلية ⚙️</SelectItem>
                          <SelectItem value="expenses" className="font-tajawal">مصروف 💸</SelectItem>
                          <SelectItem value="withdrawal" className="font-tajawal">سحب 💰</SelectItem>
                          <SelectItem value="rent" className="font-tajawal">إيجار 🏢</SelectItem>
                          <SelectItem value="utilities" className="font-tajawal">فواتير ⚡</SelectItem>
                          <SelectItem value="supplies" className="font-tajawal">مواد 📦</SelectItem>
                          <SelectItem value="other_expense" className="font-tajawal">مصروف آخر ➖</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">ملاحظات (اختياري)</Label>
                  <Input
                    value={transactionForm.notes}
                    onChange={(e) =>
                      setTransactionForm({ ...transactionForm, notes: e.target.value })
                    }
                    placeholder="ملاحظات إضافية"
                    className="font-tajawal placeholder:font-tajawal"
                  />
                </div>

                <Button onClick={handleAddTransaction} className="w-full font-cairo" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة العملية
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* بطاقات الملخص السريع */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الرصيد الحالي</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${currentBalance >= 0 ? 'text-blue-600' : 'text-green-600'}`}>
              {formatCurrencyEnglish(currentBalance, "ج.م")}
            </div>
            <div className="flex items-center text-xs mt-1">
              {currentBalance >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              <span className={`font-tajawal ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentBalance >= 0 ? 'رصيد إيجابي' : 'تحذير: رصيد سالب'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">دخل اليوم</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">
              {formatCurrencyEnglish(todayIncome, "ج.م")}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {formatNumberEnglish(todayTransactions.filter(t => t.type === 'income').length)} عملية
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">مصاريف اليوم</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 font-tajawal">
              {formatCurrencyEnglish(todayExpenses, "ج.م")}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {formatNumberEnglish(todayTransactions.filter(t => t.type === 'expense').length)} عملية
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">صافي اليوم</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajawal ${
              (todayIncome - todayExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrencyEnglish(todayIncome - todayExpenses, "ج.م")}
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-tajawal">
              {(todayIncome - todayExpenses) >= 0 ? 'ربح' : 'خسارة'} صافية
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="gap-2 font-cairo data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 font-cairo data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4" />
              المعاملات
            </TabsTrigger>
            <TabsTrigger value="income-expense" className="gap-2 font-cairo data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-4 w-4" />
              الدخل والسحب
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 font-cairo data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 font-cairo data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PieChart className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>
        </div>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* رسم التدفق النقدي */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <TrendingUp className="h-5 w-5" />
                  التدفق النقدي - آخر 7 أيام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `التاريخ: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="الإيرادات"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="المصروفات"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* توزيع المصروفات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <PieChart className="h-5 w-5" />
                  توزيع المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid gap-4 md:grid-cols-4">
            <ExpenseIntegrationStatus />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-cairo">ملخص الفترة الحالية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-tajawal">
                <div className="flex justify-between">
                  <span>إجمالي الدخل:</span>
                  <span className="font-bold text-green-600">{formatCurrencyEnglish(totalIncome, "ج.م")}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي المصروفات:</span>
                  <span className="font-bold text-red-600">{formatCurrencyEnglish(totalExpenses, "ج.م")}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">صافي التدفق:</span>
                    <span className={`font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrencyEnglish(netFlow, "ج.م")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-cairo">معدل العمليات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-tajawal">
                <div className="flex justify-between">
                  <span>عمليات اليوم:</span>
                  <span className="font-bold">{formatNumberEnglish(todayTransactions.length)}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي العمليات:</span>
                  <span className="font-bold">{formatNumberEnglish(transactions.length)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">متوسط المبلغ:</span>
                    <span className="font-bold">
                      {formatCurrency(transactions.length > 0 ? 
                        transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
                      ).replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-cairo">
                  <AlertTriangle className="h-5 w-5" />
                  تنبيهات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-tajawal">
                {currentBalance < 1000 && (
                  <div className="p-2 bg-red-50 text-red-800 rounded text-sm">
                    تحذير: الرصيد منخفض
                  </div>
                )}
                {todayExpenses > todayIncome && (
                  <div className="p-2 bg-yellow-50 text-yellow-800 rounded text-sm">
                    تنبيه: مصروفات اليوم تتجاوز الدخل
                  </div>
                )}
                {todayTransactions.length === 0 && (
                  <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
                    لم تتم أي عملية اليوم
                  </div>
                )}
                {currentBalance >= 1000 && todayIncome >= todayExpenses && todayTransactions.length > 0 && (
                  <div className="p-2 bg-green-50 text-green-800 rounded text-sm">
                    ✅ الوضع المالي جيد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب المعاملات */}
        <TabsContent value="transactions" className="space-y-6">
          {/* أدوات الفلترة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <Filter className="h-5 w-5" />
                فلترة وبحث المعاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="font-tajawal">بحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في الوصف أو الفئة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-tajawal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">الفئة</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="font-tajawal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-tajawal">
                      <SelectItem value="all">جميع الفئات</SelectItem>
                      <SelectItem value="sales">مبيعات</SelectItem>
                      <SelectItem value="services">خدمات</SelectItem>
                      <SelectItem value="operational">مصاريف تشغيلية</SelectItem>
                      <SelectItem value="rent">إيجار</SelectItem>
                      <SelectItem value="utilities">فواتير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">الفترة</Label>
                  <Select 
                    value="custom" 
                    onValueChange={(value) => {
                      const now = new Date();
                      switch(value) {
                        case 'today':
                          setDateRange({ from: now, to: now });
                          break;
                        case 'thisMonth':
                          setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                          break;
                        case 'thisYear':
                          setDateRange({ from: startOfYear(now), to: endOfYear(now) });
                          break;
                      }
                    }}
                  >
                    <SelectTrigger className="font-tajawal">
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent className="font-tajawal">
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="thisMonth">هذا الشهر</SelectItem>
                      <SelectItem value="thisYear">هذا العام</SelectItem>
                      <SelectItem value="custom">فترة مخصصة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-tajawal">تصدير</Label>
                  <Button onClick={exportData} variant="outline" className="w-full gap-2 font-tajawal">
                    <Download className="h-4 w-4" />
                    تصدير CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة المعاملات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  المعاملات ({filteredTransactions.length.toString().replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')})
                </span>
                <Badge variant="outline">
                  صافي: {formatCurrency(netFlow)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(transaction.date, 'yyyy/MM/dd HH:mm')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryDisplayName(transaction.category)}
                          </Badge>
                          {transaction.paymentMethod && (
                            <Badge variant="secondary" className="text-xs">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {transaction.paymentMethod}
                            </Badge>
                          )}
                        </div>
                        {transaction.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📝 {transaction.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      {transaction.referenceId && (
                        <div className="text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 inline mr-1" />
                          مرجع: {transaction.referenceId.slice(-6)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد معاملات مطابقة للفلاتر المحددة</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب تفاصيل الدخل والسحب */}
        <TabsContent value="income-expense" className="space-y-6">
          {/* إحصائيات سريعة للدخل والسحب */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium font-tajawal flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  إجمالي الدخل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 font-tajawal">
                  {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-tajawal">
                  {filteredTransactions.filter(t => t.type === 'income').length.toString().replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')} عملية
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium font-tajawal flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                  إجمالي المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 font-tajawal">
                  {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-tajawal">
                  {filteredTransactions.filter(t => t.type === 'expense').length.toString().replace(/٠/g, '0').replace(/١/g, '1').replace(/٢/g, '2').replace(/٣/g, '3').replace(/٤/g, '4').replace(/٥/g, '5').replace(/٦/g, '6').replace(/٧/g, '7').replace(/٨/g, '8').replace(/٩/g, '9')} عملية
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium font-tajawal flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  متوسط العملية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 font-tajawal">
                  {formatCurrency(filteredTransactions.length > 0 ? 
                    filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length : 0
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-tajawal">
                  للفترة المحددة
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium font-tajawal flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  الرصيد المتغير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-tajawal ${
                  (filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
                   filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
                    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-tajawal">
                  صافي الحركة
                </div>
              </CardContent>
            </Card>
          </div>

          {/* جداول منفصلة للدخل والمصروفات */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* جدول عمليات الدخل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                  عمليات الدخل ({filteredTransactions.filter(t => t.type === 'income').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.filter(t => t.type === 'income').map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50/50 hover:bg-green-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-green-800">{transaction.description}</p>
                          <div className="flex items-center gap-3 text-sm text-green-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(transaction.date, 'dd/MM/yyyy HH:mm')}
                            </span>
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                              {getCategoryDisplayName(transaction.category)}
                            </Badge>
                          </div>
                          {transaction.paymentMethod && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <CreditCard className="h-3 w-3" />
                              {transaction.paymentMethod}
                            </div>
                          )}
                          {transaction.notes && (
                            <p className="text-xs text-green-600 mt-1">
                              📝 {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-green-600">
                          +{formatCurrency(transaction.amount)}
                        </div>
                        {transaction.referenceId && (
                          <div className="text-xs text-green-500">
                            مرجع: {transaction.referenceId.slice(-6)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredTransactions.filter(t => t.type === 'income').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد عمليات دخل في الفترة المحددة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* جدول عمليات المصروفات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-red-600">
                  <ArrowDownRight className="h-5 w-5" />
                  عمليات المصروفات ({filteredTransactions.filter(t => t.type === 'expense').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.filter(t => t.type === 'expense').map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50/50 hover:bg-red-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-100 text-red-600">
                          <ArrowDownRight className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-red-800">{transaction.description}</p>
                          <div className="flex items-center gap-3 text-sm text-red-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(transaction.date, 'dd/MM/yyyy HH:mm')}
                            </span>
                            <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                              {getCategoryDisplayName(transaction.category)}
                            </Badge>
                          </div>
                          {transaction.paymentMethod && (
                            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                              <CreditCard className="h-3 w-3" />
                              {transaction.paymentMethod}
                            </div>
                          )}
                          {transaction.notes && (
                            <p className="text-xs text-red-600 mt-1">
                              📝 {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-red-600">
                          -{formatCurrency(transaction.amount)}
                        </div>
                        {transaction.referenceId && (
                          <div className="text-xs text-red-500">
                            مرجع: {transaction.referenceId.slice(-6)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredTransactions.filter(t => t.type === 'expense').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowDownRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد عمليات مصروفات في الفترة المحددة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* تحليل تفصيلي */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <BarChart3 className="h-5 w-5" />
                تحليل تفصيلي للعمليات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* تحليل الدخل بحسب الفئة */}
                <div>
                  <h4 className="font-semibold mb-4 text-green-600">توزيع الدخل حسب الفئة</h4>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredTransactions
                        .filter(t => t.type === 'income')
                        .reduce((acc, t) => {
                          const category = getCategoryDisplayName(t.category);
                          acc[category] = (acc[category] || 0) + t.amount;
                          return acc;
                        }, {} as { [key: string]: number })
                    ).map(([category, amount]) => {
                      const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                      const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* تحليل المصروفات بحسب الفئة */}
                <div>
                  <h4 className="font-semibold mb-4 text-red-600">توزيع المصروفات حسب الفئة</h4>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((acc, t) => {
                          const category = getCategoryDisplayName(t.category);
                          acc[category] = (acc[category] || 0) + t.amount;
                          return acc;
                        }, {} as { [key: string]: number })
                    ).map(([category, amount]) => {
                      const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="font-bold text-red-600">
                              {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التقارير */}
        <TabsContent value="reports" className="space-y-6">
          <CashReports 
            transactions={transactions} 
            currentBalance={currentBalance}
          />
        </TabsContent>

        {/* تبويب التحليلات */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <BarChart3 className="h-5 w-5" />
                  مقارنة الدخل والمصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `التاريخ: ${label}`}
                    />
                    <Bar dataKey="income" fill="#10b981" name="الدخل" />
                    <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات متقدمة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-600">متوسط العملية</div>
                          <div className="text-lg font-bold text-blue-700">
                            {formatCurrency(
                              transactions.length > 0 ? 
                              transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
                            )}
                          </div>
                        </div>
                        <Calculator className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-green-600">أفضل يوم</div>
                          <div className="text-lg font-bold text-green-700">
                            {formatCurrency(Math.max(...chartData.map(d => d.net)))}
                          </div>
                        </div>
                        <Zap className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>نسبة المبيعات من إجمالي الدخل</span>
                        <span className="font-medium">
                          {totalIncome > 0 ? 
                            ((transactions.filter(t => t.category === 'sales').reduce((sum, t) => sum + t.amount, 0) / totalIncome) * 100).toFixed(1) + '%' :
                            '0%'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={totalIncome > 0 ? 
                          (transactions.filter(t => t.category === 'sales').reduce((sum, t) => sum + t.amount, 0) / totalIncome) * 100 : 0
                        } 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>نسبة المصاريف التشغيلية</span>
                        <span className="font-medium">
                          {totalExpenses > 0 ? 
                            ((transactions.filter(t => t.category === 'operational').reduce((sum, t) => sum + t.amount, 0) / totalExpenses) * 100).toFixed(1) + '%' :
                            '0%'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={totalExpenses > 0 ? 
                          (transactions.filter(t => t.category === 'operational').reduce((sum, t) => sum + t.amount, 0) / totalExpenses) * 100 : 0
                        } 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توصيات ذكية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {netFlow < 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800 mb-2">🚨 تحسين التدفق النقدي</div>
                        <div className="text-sm text-red-600">
                          يُنصح بمراجعة المصروفات وزيادة الإيرادات لتحسين التدفق النقدي.
                        </div>
                      </div>
                    )}

                    {currentBalance < 5000 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800 mb-2">⚠️ بناء احتياطي نقدي</div>
                        <div className="text-sm text-yellow-600">
                          يُنصح ببناء احتياطي نقدي لا يقل عن 10,000 جنيه لضمان السيولة.
                        </div>
                      </div>
                    )}

                    {transactions.filter(t => t.type === 'expense' && t.category === 'operational').reduce((sum, t) => sum + t.amount, 0) / totalExpenses > 0.5 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium text-orange-800 mb-2">📊 تحسين المصاريف</div>
                        <div className="text-sm text-orange-600">
                          المصاريف التشغيلية تشكل نسبة كبيرة. يمكن البحث عن طرق لتوفير التكاليف.
                        </div>
                      </div>
                    )}

                    {netFlow > 0 && currentBalance > 10000 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800 mb-2">✅ أداء ممتاز</div>
                        <div className="text-sm text-green-600">
                          التدفق النقدي إيجابي والرصيد جيد. يمكن التفكير في الاستثمار أو التوسع.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}