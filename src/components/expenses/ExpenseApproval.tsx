import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";

interface ExpenseApproval {
  id: string;
  expenseId: string;
  expenseDescription: string;
  expenseAmount: number;
  expenseCategory: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  approvalLevel: 1 | 2 | 3; // مستوى الموافقة المطلوب
  notes?: string;
}

interface ApprovalRule {
  id: string;
  category: string;
  minimumAmount: number;
  approvalLevel: 1 | 2 | 3;
  approvers: string[];
  isActive: boolean;
}

interface ExpenseApprovalProps {
  expenses: any[];
  currentUser?: string;
}

export default function ExpenseApproval({ expenses, currentUser = "المدير العام" }: ExpenseApprovalProps) {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ExpenseApproval[]>(() => 
    storage.getItem('expense_approvals', [])
  );
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>(() => 
    storage.getItem('approval_rules', [])
  );
  const [selectedApproval, setSelectedApproval] = useState<ExpenseApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  // قواعد الموافقة الافتراضية
  useEffect(() => {
    if (approvalRules.length === 0) {
      const defaultRules: ApprovalRule[] = [
        {
          id: "rule_1",
          category: "all",
          minimumAmount: 1000,
          approvalLevel: 1,
          approvers: ["المدير العام", "مدير الحسابات"],
          isActive: true
        },
        {
          id: "rule_2", 
          category: "all",
          minimumAmount: 5000,
          approvalLevel: 2,
          approvers: ["المدير العام"],
          isActive: true
        },
        {
          id: "rule_3",
          category: "رواتب الموظفين",
          minimumAmount: 500,
          approvalLevel: 1,
          approvers: ["مدير الموارد البشرية", "المدير العام"],
          isActive: true
        }
      ];
      setApprovalRules(defaultRules);
      storage.setItem('approval_rules', defaultRules);
    }
  }, []);

  // فحص المصروفات التي تحتاج موافقة
  useEffect(() => {
    checkExpensesForApproval();
  }, [expenses, approvalRules]);

  // فحص المصروفات التي تحتاج موافقة
  const checkExpensesForApproval = () => {
    const newApprovals: ExpenseApproval[] = [];

    expenses.forEach(expense => {
      // تحقق إذا كان المصروف بحاجة موافقة ولم يتم إنشاء طلب موافقة له
      const existingApproval = approvals.find(approval => approval.expenseId === expense.id);
      if (existingApproval) return;

      // تحديد مستوى الموافقة المطلوب
      const requiredRule = getRequiredApprovalRule(expense);
      if (requiredRule) {
        const priority = determinePriority(expense.amount);
        
        const approval: ExpenseApproval = {
          id: `APPROVAL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          expenseId: expense.id,
          expenseDescription: expense.description,
          expenseAmount: expense.amount,
          expenseCategory: expense.category,
          requestedBy: expense.createdBy || "مستخدم النظام",
          requestedAt: expense.createdAt || new Date().toISOString(),
          status: 'pending',
          priority,
          approvalLevel: requiredRule.approvalLevel,
          notes: expense.notes
        };

        newApprovals.push(approval);
      }
    });

    if (newApprovals.length > 0) {
      const updatedApprovals = [...approvals, ...newApprovals];
      setApprovals(updatedApprovals);
      storage.setItem('expense_approvals', updatedApprovals);

      toast({
        title: "طلبات موافقة جديدة",
        description: `يوجد ${newApprovals.length} طلب موافقة جديد في الانتظار`
      });
    }
  };

  // تحديد قاعدة الموافقة المطلوبة
  const getRequiredApprovalRule = (expense: any): ApprovalRule | null => {
    const applicableRules = approvalRules.filter(rule => 
      rule.isActive && 
      (rule.category === "all" || rule.category === expense.category) &&
      expense.amount >= rule.minimumAmount
    );

    // إرجاع أعلى مستوى موافقة مطلوب
    return applicableRules.reduce((highest, current) => 
      current.approvalLevel > (highest?.approvalLevel || 0) ? current : highest
    , null);
  };

  // تحديد أولوية الطلب
  const determinePriority = (amount: number): 'low' | 'medium' | 'high' | 'urgent' => {
    if (amount >= 10000) return 'urgent';
    if (amount >= 5000) return 'high';
    if (amount >= 2000) return 'medium';
    return 'low';
  };

  // الموافقة على المصروف
  const approveExpense = (approvalId: string) => {
    const updatedApprovals = approvals.map(approval =>
      approval.id === approvalId
        ? {
            ...approval,
            status: 'approved' as const,
            approvedBy: currentUser,
            approvedAt: new Date().toISOString(),
            notes: approvalNotes
          }
        : approval
    );

    setApprovals(updatedApprovals);
    storage.setItem('expense_approvals', updatedApprovals);

    // تحديث حالة المصروف إلى مدفوع
    const approval = approvals.find(a => a.id === approvalId);
    if (approval) {
      // هنا يمكن تحديث المصروف في قاعدة البيانات
      toast({
        title: "تمت الموافقة",
        description: `تمت الموافقة على مصروف "${approval.expenseDescription}"`
      });
    }

    setSelectedApproval(null);
    setApprovalNotes("");
  };

  // رفض المصروف
  const rejectExpense = (approvalId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال سبب الرفض",
        variant: "destructive"
      });
      return;
    }

    const updatedApprovals = approvals.map(approval =>
      approval.id === approvalId
        ? {
            ...approval,
            status: 'rejected' as const,
            approvedBy: currentUser,
            approvedAt: new Date().toISOString(),
            rejectionReason
          }
        : approval
    );

    setApprovals(updatedApprovals);
    storage.setItem('expense_approvals', updatedApprovals);

    const approval = approvals.find(a => a.id === approvalId);
    if (approval) {
      toast({
        title: "تم الرفض",
        description: `تم رفض مصروف "${approval.expenseDescription}"`
      });
    }

    setSelectedApproval(null);
    setRejectionReason("");
  };

  // تصفية طلبات الموافقة
  const pendingApprovals = approvals.filter(approval => approval.status === 'pending');
  const approvedApprovals = approvals.filter(approval => approval.status === 'approved');
  const rejectedApprovals = approvals.filter(approval => approval.status === 'rejected');

  // أيقونات الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // ألوان الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600 font-tajawal">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground font-tajawal">في الانتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 font-tajawal">{approvedApprovals.length}</div>
            <p className="text-xs text-muted-foreground font-tajawal">تمت الموافقة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600 font-tajawal">{rejectedApprovals.length}</div>
            <p className="text-xs text-muted-foreground font-tajawal">مرفوضة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold font-tajawal">{approvals.length}</div>
            <p className="text-xs text-muted-foreground font-tajawal">إجمالي الطلبات</p>
          </CardContent>
        </Card>
      </div>

      {/* طلبات الموافقة المعلقة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Clock className="h-5 w-5" />
            طلبات الموافقة المعلقة ({pendingApprovals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">الوصف</TableHead>
                <TableHead className="font-tajawal">الفئة</TableHead>
                <TableHead className="font-tajawal">المبلغ</TableHead>
                <TableHead className="font-tajawal">الأولوية</TableHead>
                <TableHead className="font-tajawal">تاريخ الطلب</TableHead>
                <TableHead className="font-tajawal">المستوى</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell className="font-medium">{approval.expenseDescription}</TableCell>
                  <TableCell>{approval.expenseCategory}</TableCell>
                  <TableCell>{approval.expenseAmount.toLocaleString()} ج.م</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(approval.priority)}>
                      {approval.priority === 'urgent' ? 'عاجل' :
                       approval.priority === 'high' ? 'عالي' :
                       approval.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(approval.requestedAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>مستوى {approval.approvalLevel}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedApproval(approval)}
                          >
                            مراجعة
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>مراجعة طلب الموافقة</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <Label>الوصف</Label>
                              <p className="text-sm">{approval.expenseDescription}</p>
                            </div>
                            <div className="grid gap-2">
                              <Label>المبلغ</Label>
                              <p className="text-sm font-bold">{approval.expenseAmount.toLocaleString()} ج.م</p>
                            </div>
                            <div className="grid gap-2">
                              <Label>الفئة</Label>
                              <p className="text-sm">{approval.expenseCategory}</p>
                            </div>
                            <div className="grid gap-2">
                              <Label>طلبه</Label>
                              <p className="text-sm">{approval.requestedBy}</p>
                            </div>
                            {approval.notes && (
                              <div className="grid gap-2">
                                <Label>ملاحظات</Label>
                                <p className="text-sm">{approval.notes}</p>
                              </div>
                            )}
                            <div className="grid gap-2">
                              <Label>ملاحظات الموافقة</Label>
                              <Textarea
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                placeholder="ملاحظات إضافية..."
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>سبب الرفض (إذا كان مطلوباً)</Label>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="سبب رفض الطلب..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => approveExpense(approval.id)}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 ml-2" />
                                موافقة
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => rejectExpense(approval.id)}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 ml-2" />
                                رفض
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pendingApprovals.length === 0 && (
            <div className="text-center py-6 text-muted-foreground font-tajawal">
              لا توجد طلبات موافقة معلقة
            </div>
          )}
        </CardContent>
      </Card>

      {/* سجل الموافقات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <FileText className="h-5 w-5" />
            سجل جميع الموافقات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الوصف</TableHead>
                <TableHead className="font-tajawal">المبلغ</TableHead>
                <TableHead className="font-tajawal">تم بواسطة</TableHead>
                <TableHead className="font-tajawal">تاريخ القرار</TableHead>
                <TableHead className="font-tajawal">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...approvedApprovals, ...rejectedApprovals]
                .sort((a, b) => new Date(b.approvedAt || '').getTime() - new Date(a.approvedAt || '').getTime())
                .map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(approval.status)}
                      <span className={`text-sm ${
                        approval.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {approval.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{approval.expenseDescription}</TableCell>
                  <TableCell>{approval.expenseAmount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{approval.approvedBy}</TableCell>
                  <TableCell>
                    {approval.approvedAt && new Date(approval.approvedAt).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    {approval.status === 'rejected' ? approval.rejectionReason : approval.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}