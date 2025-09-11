import { FileText, TrendingUp, TrendingDown, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { storage } from "@/utils/storage";
import { checksManager } from "@/utils/checksManager";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  type: "sale" | "purchase" | "expense" | "check";
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "cashed" | "bounced";
  date: string;
  invoiceNumber: string;
  checkNumber?: string;
  dueDate?: string;
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "sale":
      return TrendingUp;
    case "purchase":
      return TrendingDown;
    case "expense":
      return FileText;
    case "check":
      return Clock;
    default:
      return FileText;
  }
}

function getTransactionTypeText(type: string) {
  switch (type) {
    case "sale":
      return "مبيعات";
    case "purchase":
      return "مشتريات";
    case "expense":
      return "مصروف";
    case "check":
      return "شيك";
    default:
      return type;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "paid":
    case "cashed":
      return "success";
    case "pending":
      return "warning";
    case "overdue":
    case "bounced":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "paid":
      return "مدفوع";
    case "pending":
      return "معلق";
    case "overdue":
      return "متأخر";
    case "cashed":
      return "محصل";
    case "bounced":
      return "مرتد";
    default:
      return status;
  }
}

export function RecentTransactions() {
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = () => {
    try {
      const salesInvoices = storage.getItem('sales_invoices', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const expenses = storage.getItem('expenses', []);
      const checks = checksManager.getChecks();

      const allTransactions: Transaction[] = [];

      // إضافة فواتير المبيعات
      salesInvoices.forEach((invoice: any, index: number) => {
        allTransactions.push({
          id: invoice.id || `sale-${index}`,
          type: "sale",
          customer: invoice.customerName || invoice.customer || 'عميل غير محدد',
          amount: invoice.total || 0,
          status: invoice.status || "paid",
          date: invoice.date || new Date().toISOString(),
          invoiceNumber: invoice.invoiceNumber || `INV-${index + 1}`
        });
      });

      // إضافة فواتير المشتريات
      purchaseInvoices.forEach((invoice: any, index: number) => {
        allTransactions.push({
          id: invoice.id || `purchase-${index}`,
          type: "purchase",
          customer: invoice.supplier || invoice.supplierName || 'مورد غير محدد',
          amount: invoice.total || 0,
          status: invoice.status || "paid",
          date: invoice.date || new Date().toISOString(),
          invoiceNumber: invoice.invoiceNumber || `PUR-${index + 1}`
        });
      });

      // إضافة المصروفات
      expenses.forEach((expense: any, index: number) => {
        allTransactions.push({
          id: expense.id || `expense-${index}`,
          type: "expense",
          customer: expense.description || expense.category || 'مصروف عام',
          amount: expense.amount || 0,
          status: "paid",
          date: expense.date || new Date().toISOString(),
          invoiceNumber: expense.reference || `EXP-${index + 1}`
        });
      });

      // إضافة الشيكات
      checks.forEach((check: any, index: number) => {
        allTransactions.push({
          id: check.id || `check-${index}`,
          type: "check",
          customer: check.customerName || 'عميل غير محدد',
          amount: check.amount || 0,
          status: check.status === 'pending' ? 'pending' : 
                  check.status === 'cashed' ? 'cashed' : 
                  check.status === 'bounced' ? 'bounced' : 'pending',
          date: check.dateReceived || new Date().toISOString(),
          invoiceNumber: check.checkNumber || `CHK-${index + 1}`,
          checkNumber: check.checkNumber,
          dueDate: check.dueDate
        });
      });

      // ترتيب المعاملات حسب التاريخ (الأحدث أولاً) وأخذ آخر 15
      const sortedTransactions = allTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 15);

      setRecentTransactions(sortedTransactions);
    } catch (error) {
      console.error('خطأ في تحميل المعاملات الحديثة:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/sales/invoices');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          المعاملات الحديثة
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleViewAll}>
          <Eye className="h-4 w-4 ml-2" />
          عرض الكل
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-card-hover transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        transaction.type === "sale" && "bg-success/10 text-success",
                        transaction.type === "purchase" && "bg-warning/10 text-warning",
                        transaction.type === "expense" && "bg-destructive/10 text-destructive",
                        transaction.type === "check" && "bg-blue-500/10 text-blue-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {transaction.customer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTransactionTypeText(transaction.type)} • {transaction.invoiceNumber}
                        {transaction.type === "check" && transaction.dueDate && (
                          <span className="mr-1">• استحقاق: {new Date(transaction.dueDate).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                            calendar: 'gregory',
                            numberingSystem: 'latn'
                          })}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-left flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {(transaction.amount || 0).toLocaleString()} ج.م
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          calendar: 'gregory',
                          numberingSystem: 'latn'
                        })}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(transaction.status) as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                      {getStatusText(transaction.status)}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد معاملات حديثة</p>
              <p className="text-sm text-muted-foreground mt-2">
                ابدأ بإنشاء فاتورة مبيعات أو مشتريات
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}