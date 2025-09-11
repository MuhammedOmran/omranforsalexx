import { useState, useEffect } from "react";
import { Plus, Search, Calendar, DollarSign, FileText, Trash2, Edit, RotateCcw, Archive, BarChart3, Bell, Paperclip, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { expensesManager } from "@/utils/expensesManager";
import ExpenseAnalytics from "@/components/expenses/ExpenseAnalytics";
import ExpenseReports from "@/components/expenses/ExpenseReports";
import ExpenseAttachments from "@/components/expenses/ExpenseAttachments";
import ExpenseAlerts from "@/components/expenses/ExpenseAlerts";
import ExpenseApproval from "@/components/expenses/ExpenseApproval";
import ExpenseConflictResolver from "@/components/expenses/ExpenseConflictResolver";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  status: 'paid' | 'pending';
  employeeId?: string;
  employeeName?: string;
}

interface DeletedExpense extends Expense {
  deletedAt: string;
  deletedBy?: string;
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

export default function Expenses() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deletedExpenses, setDeletedExpenses] = useState<DeletedExpense[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showDeletedExpenses, setShowDeletedExpenses] = useState(false);

  useEffect(() => {
    // Load expenses
    setExpenses(expensesManager.getExpenses());
    setDeletedExpenses(expensesManager.getDeletedExpenses());
    
    // Load employees using storage 
    const loadEmployees = async () => {
      try {
        const { storage } = await import('@/utils/storage');
        const employees = storage.getItem('employees', []);
        setEmployees(employees);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    
    loadEmployees();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("expenses");
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
    notes: "",
    status: "paid" as 'paid' | 'pending',
    employeeId: "",
    employeeName: ""
  });

  const handleAddExpense = () => {
    if (!formData.description || !formData.amount || !formData.category || !formData.date) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      notes: formData.notes,
      status: formData.status,
      employeeId: formData.employeeId,
      employeeName: formData.employeeName
    };

    let updatedExpenses;
    if (editingExpense) {
      updatedExpenses = expenses.map(expense => 
        expense.id === editingExpense.id ? { ...newExpense, id: editingExpense.id } : expense
      );
      toast({
        title: "تم التحديث",
        description: "تم تحديث المصروف بنجاح"
      });
    } else {
      updatedExpenses = [...expenses, newExpense];
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المصروف بنجاح"
      });
    }
    
    setExpenses(updatedExpenses);
    
    // Use expensesManager for saving
    if (editingExpense) {
      expensesManager.updateExpense(editingExpense.id, newExpense);
    } else {
      expensesManager.addExpense(newExpense);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: "",
      notes: "",
      status: "paid",
      employeeId: "",
      employeeName: ""
    });
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || "",
      status: expense.status,
      employeeId: expense.employeeId || "",
      employeeName: expense.employeeName || ""
    });
    setIsDialogOpen(true);
  };

  // نقل المصروف إلى المحذوفات (حذف مؤقت)
  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(expense => expense.id === id);
    if (!expenseToDelete) return;

    // إضافة المصروف إلى قائمة المحذوفات
    const deletedExpense: DeletedExpense = {
      ...expenseToDelete,
      deletedAt: new Date().toISOString(),
      deletedBy: 'المستخدم الحالي' // يمكن تحسينها لاحقاً مع نظام المستخدمين
    };

    // Use expensesManager for deletion
    expensesManager.deleteExpense(id);
    
    // Update local state
    setExpenses(expensesManager.getExpenses());
    setDeletedExpenses(expensesManager.getDeletedExpenses());

    toast({
      title: "تم الحذف",
      description: "تم نقل المصروف إلى المحذوفات - يمكن استعادته لاحقاً"
    });
  };

  // نقل جميع المصروفات إلى المحذوفات
  const handleDeleteAllExpenses = () => {
    if (expenses.length === 0) return;

    const deletedExpensesFromAll: DeletedExpense[] = expenses.map(expense => ({
      ...expense,
      deletedAt: new Date().toISOString(),
      deletedBy: 'المستخدم الحالي'
    }));

    // Use expensesManager for bulk deletion
    expensesManager.deleteAllExpenses();
    
    // Update local state
    setExpenses(expensesManager.getExpenses());
    setDeletedExpenses(expensesManager.getDeletedExpenses());

    toast({
      title: "تم الحذف",
      description: `تم نقل ${expenses.length} مصروف إلى المحذوفات - يمكن استعادتها لاحقاً`
    });
  };

  // استعادة مصروف محذوف
  const handleRestoreExpense = (id: string) => {
    const expenseToRestore = deletedExpenses.find(expense => expense.id === id);
    if (!expenseToRestore) return;

    // Use expensesManager for restoration
    expensesManager.restoreExpense(id);
    
    // Update local state
    setExpenses(expensesManager.getExpenses());
    setDeletedExpenses(expensesManager.getDeletedExpenses());

    toast({
      title: "تم الاستعادة",
      description: "تم استعادة المصروف بنجاح"
    });
  };

  // حذف نهائي للمصروف
  const handlePermanentDeleteExpense = (id: string) => {
    // Use expensesManager for permanent deletion
    expensesManager.permanentDeleteExpense(id);
    setDeletedExpenses(expensesManager.getDeletedExpenses());

    toast({
      title: "تم الحذف نهائياً",
      description: "تم حذف المصروف نهائياً ولا يمكن استعادته",
      variant: "destructive"
    });
  };

  // حذف جميع المصروفات المحذوفة نهائياً
  const handleClearDeletedExpenses = () => {
    // Use expensesManager for clearing deleted expenses
    expensesManager.clearDeletedExpenses();
    setDeletedExpenses(expensesManager.getDeletedExpenses());

    toast({
      title: "تم المسح",
      description: "تم حذف جميع المصروفات المحذوفة نهائياً"
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* التبويبات */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-cairo">المصروفات</h1>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === "expenses" ? "default" : "outline"}
              onClick={() => setActiveTab("expenses")}
              className="font-cairo"
            >
              <FileText className="h-4 w-4 ml-2" />
              المصروفات
            </Button>
            <Button 
              variant={activeTab === "analytics" ? "default" : "outline"}
              onClick={() => setActiveTab("analytics")}
              className="font-cairo"
            >
              <BarChart3 className="h-4 w-4 ml-2" />
              التحليلات
            </Button>
            <Button 
              variant={activeTab === "reports" ? "default" : "outline"}
              onClick={() => setActiveTab("reports")}
              className="font-cairo"
            >
              <FileText className="h-4 w-4 ml-2" />
              التقارير
            </Button>
            <Button 
              variant={activeTab === "alerts" ? "default" : "outline"}
              onClick={() => setActiveTab("alerts")}
              className="font-cairo"
            >
              <Bell className="h-4 w-4 ml-2" />
              التنبيهات
            </Button>
            <Button 
              variant={activeTab === "approval" ? "default" : "outline"}
              onClick={() => setActiveTab("approval")}
              className="font-cairo"
            >
              <CheckCircle className="h-4 w-4 ml-2" />
              الموافقات
            </Button>
            <Button 
              variant={activeTab === "conflicts" ? "default" : "outline"}
              onClick={() => setActiveTab("conflicts")}
              className="font-cairo"
            >
              <AlertTriangle className="h-4 w-4 ml-2" />
              حل التعارضات
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showDeletedExpenses ? "default" : "outline"}
            onClick={() => setShowDeletedExpenses(!showDeletedExpenses)}
            className="font-cairo"
          >
            <Archive className="h-4 w-4 ml-2" />
            {showDeletedExpenses ? "إخفاء المصروفات المحذوفة" : `المصروفات المحذوفة (${deletedExpenses.length})`}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAllExpenses}
            disabled={expenses.length === 0}
            className="font-cairo"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف جميع المصروفات
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingExpense(null)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "تعديل المصروف" : "إضافة مصروف جديد"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "تعديل بيانات المصروف" : "أدخل تفاصيل المصروف الجديد"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">الوصف *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف المصروف"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">الفئة *</Label>
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
              <div className="grid gap-2">
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={formData.status} onValueChange={(value: 'paid' | 'pending') => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="ملاحظات إضافية"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              <Button onClick={handleAddExpense}>
                {editingExpense ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* المحتوى حسب التبويب المختار */}
      {activeTab === "expenses" && (
        <>
          {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المصروفات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalExpenses.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المصروفات المدفوعة</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">{paidExpenses.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المصروفات المعلقة</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 font-tajawal">{pendingExpenses.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في المصروفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات</CardTitle>
          <CardDescription>
            عرض جميع المصروفات ({filteredExpenses.length} مصروف)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">الوصف</TableHead>
                <TableHead className="font-tajawal">الفئة</TableHead>
                <TableHead className="font-tajawal">المبلغ</TableHead>
                <TableHead className="font-tajawal">التاريخ</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-sm text-muted-foreground">{expense.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="font-medium">{expense.amount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                      {expense.status === 'paid' ? 'مدفوع' : 'معلق'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
       </Card>
        </>
      )}

      {/* التحليلات */}
      {activeTab === "analytics" && <ExpenseAnalytics expenses={expenses} />}

      {/* التقارير */}
      {activeTab === "reports" && <ExpenseReports expenses={expenses} />}

      {/* التنبيهات */}
      {activeTab === "alerts" && <ExpenseAlerts expenses={expenses} />}

      {/* الموافقات */}
      {activeTab === "approval" && <ExpenseApproval expenses={expenses} />}

      {/* حل التعارضات */}
      {activeTab === "conflicts" && <ExpenseConflictResolver />}

      {/* Deleted Expenses Section */}
      {showDeletedExpenses && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-destructive">المصروفات المحذوفة</CardTitle>
                <CardDescription>
                  يمكن استعادة هذه المصروفات أو حذفها نهائياً ({deletedExpenses.length} مصروف محذوف)
                </CardDescription>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleClearDeletedExpenses}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف نهائي للكل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الحذف</TableHead>
                  <TableHead>حُذف بواسطة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedExpenses.length > 0 ? (
                  deletedExpenses.map((expense) => (
                    <TableRow key={expense.id} className="opacity-75">
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-muted-foreground">{expense.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="font-medium">{expense.amount.toLocaleString()} ج.م</TableCell>
                      <TableCell>{new Date(expense.deletedAt).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-muted-foreground">
                          {expense.deletedBy || 'غير محدد'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRestoreExpense(expense.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4 ml-1" />
                            استعادة
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handlePermanentDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف نهائي
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد مصروفات محذوفة حالياً
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}