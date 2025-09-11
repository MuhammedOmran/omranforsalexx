import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Calendar, Filter, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";

interface ExpenseReportsProps {
  expenses: any[];
}

export default function ExpenseReports({ expenses }: ExpenseReportsProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("summary");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    "إيجار المحل",
    "الكهرباء والمياه", 
    "رواتب الموظفين",
    "مصاريف التسويق",
    "صيانة المعدات",
    "مصاريف النقل",
    "أخرى"
  ];

  // تصفية المصروفات حسب الفترة والفئة
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const isInDateRange = isWithinInterval(expenseDate, {
      start: new Date(startDate),
      end: new Date(endDate)
    });
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    return isInDateRange && matchesCategory;
  });

  // حساب الإحصائيات
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const paidAmount = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const pendingAmount = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  // تجميع حسب الفئة
  const categoryBreakdown = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // تجميع حسب الشهر
  const monthlyBreakdown = filteredExpenses.reduce((acc, exp) => {
    const month = format(new Date(exp.date), 'yyyy-MM', { locale: ar });
    acc[month] = (acc[month] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // مقارنة مع الفترة السابقة
  const previousPeriodStart = subMonths(new Date(startDate), 1);
  const previousPeriodEnd = subMonths(new Date(endDate), 1);
  
  const previousPeriodExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return isWithinInterval(expenseDate, {
      start: previousPeriodStart,
      end: previousPeriodEnd
    });
  });

  const previousPeriodTotal = previousPeriodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const growthRate = previousPeriodTotal > 0 ? ((totalAmount - previousPeriodTotal) / previousPeriodTotal) * 100 : 0;

  // تصدير التقرير
  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        const XLSX = await import('xlsx');
        
        const reportData = [
          ['تقرير المصروفات'],
          ['من تاريخ:', startDate],
          ['إلى تاريخ:', endDate],
          ['الفئة:', selectedCategory === 'all' ? 'جميع الفئات' : selectedCategory],
          [],
          ['الوصف', 'الفئة', 'المبلغ', 'التاريخ', 'الحالة', 'الملاحظات'],
          ...filteredExpenses.map(exp => [
            exp.description,
            exp.category,
            exp.amount,
            exp.date,
            exp.status === 'paid' ? 'مدفوع' : 'معلق',
            exp.notes || ''
          ]),
          [],
          ['الإجماليات'],
          ['إجمالي المصروفات:', totalAmount],
          ['المدفوعة:', paidAmount],
          ['المعلقة:', pendingAmount],
          ['النمو مقارنة بالفترة السابقة:', `${growthRate.toFixed(1)}%`]
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, 'تقرير المصروفات');
        XLSX.writeFile(wb, `تقرير_المصروفات_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // تصدير PDF بنفس تصميم تقرير الأرباح
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
          return;
        }

        // حساب الإحصائيات الإضافية
        const averageExpense = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
        const pendingPercentage = totalAmount > 0 ? ((pendingAmount / totalAmount) * 100).toFixed(1) : '0';
        const paidPercentage = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : '0';

        // العثور على أكبر مصروف
        const largestExpense = filteredExpenses.length > 0 ? 
          filteredExpenses.reduce((max, exp) => exp.amount > max.amount ? exp : max, filteredExpenses[0]) : 
          { description: 'غير محدد', amount: 0, category: '', date: '' };

        const htmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <title>تقرير المصروفات</title>
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
              .stat-item { display: flex; justify-content: space-between; padding: 5px 0; }
              .stat-label { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">تقرير المصروفات المتقدم</h1>
              <div class="subtitle">تحليل شامل للمصروفات والنفقات</div>
              <div class="info">
                <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
                <div>الفترة: من ${startDate} إلى ${endDate}</div>
                <div>الفئة: ${selectedCategory === 'all' ? 'جميع الفئات' : selectedCategory}</div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">الملخص التنفيذي</h2>
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-label">إجمالي المصروفات:</span>
                  <span>${totalAmount.toLocaleString()} ج.م</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">المصروفات المدفوعة:</span>
                  <span>${paidAmount.toLocaleString()} ج.م (${paidPercentage}%)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">المصروفات المعلقة:</span>
                  <span>${pendingAmount.toLocaleString()} ج.م (${pendingPercentage}%)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">عدد المصروفات:</span>
                  <span>${filteredExpenses.length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">متوسط المصروف:</span>
                  <span>${averageExpense.toLocaleString()} ج.م</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">النمو مقارنة بالفترة السابقة:</span>
                  <span>${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            ${reportType === "detailed" ? `
            <div class="section">
              <h2 class="section-title">البيانات التفصيلية</h2>
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوصف</th>
                    <th>الفئة</th>
                    <th>المبلغ (ج.م)</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredExpenses.map(exp => `
                    <tr>
                      <td>${new Date(exp.date).toLocaleDateString('en-GB')}</td>
                      <td>${exp.description}</td>
                      <td>${exp.category}</td>
                      <td>${exp.amount.toLocaleString()}</td>
                      <td>${exp.status === 'paid' ? 'مدفوع' : 'معلق'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            ${reportType === "category" ? `
            <div class="section">
              <h2 class="section-title">التقرير حسب الفئة</h2>
              <table>
                <thead>
                  <tr>
                    <th>الفئة</th>
                    <th>المبلغ (ج.م)</th>
                    <th>النسبة (%)</th>
                    <th>عدد المصروفات</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(categoryBreakdown).map(([category, amount]) => {
                    const percentage = totalAmount > 0 ? (((amount as number) / totalAmount) * 100).toFixed(1) : '0';
                    const count = filteredExpenses.filter(e => e.category === category).length;
                    return `
                      <tr>
                        <td>${category}</td>
                        <td>${amount.toLocaleString()}</td>
                        <td>${percentage}%</td>
                        <td>${count}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            ${reportType === "monthly" ? `
            <div class="section">
              <h2 class="section-title">التقرير الشهري</h2>
              <table>
                <thead>
                  <tr>
                    <th>الشهر</th>
                    <th>المبلغ (ج.م)</th>
                    <th>عدد المصروفات</th>
                    <th>متوسط المصروف (ج.م)</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(monthlyBreakdown).map(([month, amount]) => {
                    const count = filteredExpenses.filter(e => {
                      const expenseMonth = new Date(e.date).getFullYear() + '-' + String(new Date(e.date).getMonth() + 1).padStart(2, '0');
                      return expenseMonth === month;
                    }).length;
                    const average = count > 0 ? (amount as number) / count : 0;
                    return `
                      <tr>
                        <td>${month}</td>
                        <td>${amount.toLocaleString()}</td>
                        <td>${count}</td>
                        <td>${average.toLocaleString()}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">تحليل الأداء</h2>
              <ul style="list-style-type: disc; padding-right: 20px;">
                <li>أكبر مصروف: ${largestExpense.description} بمبلغ ${largestExpense.amount.toLocaleString()} ج.م في فئة ${largestExpense.category}</li>
                <li>متوسط المصروف: ${averageExpense.toLocaleString()} ج.م</li>
                <li>نسبة المصروفات المدفوعة: ${paidPercentage}% من إجمالي المصروفات</li>
                <li>نسبة المصروفات المعلقة: ${pendingPercentage}% من إجمالي المصروفات</li>
                <li>نمو المصروفات: ${growthRate > 0 ? 'زيادة' : 'انخفاض'} بنسبة ${Math.abs(growthRate).toFixed(1)}% مقارنة بالفترة السابقة</li>
                <li>${pendingAmount > 0 ? 'يوجد مصروفات معلقة تحتاج لمتابعة' : 'جميع المصروفات مدفوعة'}</li>
              </ul>
            </div>

            <div class="footer">
              <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات</p>
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
      }

      toast({
        title: "تم التصدير",
        description: `تم تصدير التقرير بصيغة ${format === 'excel' ? 'Excel' : 'PDF'} بنجاح`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* عناصر التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <FileText className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">تقرير موجز</SelectItem>
                  <SelectItem value="detailed">تقرير مفصل</SelectItem>
                  <SelectItem value="category">تقرير حسب الفئة</SelectItem>
                  <SelectItem value="monthly">تقرير شهري</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>الفئة</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
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
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => exportReport('excel')} variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ملخص التقرير */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المصروفات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalAmount.toLocaleString()} ج.م</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className={`h-3 w-3 ml-1 ${growthRate > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <span className={`${growthRate > 0 ? 'text-red-500' : 'text-green-500'} font-tajawal`}>
                {Math.abs(growthRate).toFixed(1)}% مقارنة بالفترة السابقة
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 font-tajawal">{paidAmount.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground font-tajawal">المصروفات المدفوعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600 font-tajawal">{pendingAmount.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground font-tajawal">المصروفات المعلقة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold font-tajawal">{filteredExpenses.length}</div>
            <p className="text-xs text-muted-foreground font-tajawal">عدد المصروفات</p>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل التقرير */}
      {reportType === "detailed" && (
        <Card>
          <CardHeader>
            <CardTitle>التقرير المفصل</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.amount.toLocaleString()} ج.م</TableCell>
                    <TableCell>
                      <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                        {expense.status === 'paid' ? 'مدفوع' : 'معلق'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* تقرير حسب الفئة */}
      {reportType === "category" && (
        <Card>
          <CardHeader>
            <CardTitle>التقرير حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>النسبة</TableHead>
                  <TableHead>عدد المصروفات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(categoryBreakdown).map(([category, amount]) => {
                  const percentage = totalAmount > 0 ? (((amount as number) / totalAmount) * 100).toFixed(1) : '0';
                  const count = filteredExpenses.filter(e => e.category === category).length;
                  return (
                    <TableRow key={category}>
                      <TableCell className="font-medium">{category}</TableCell>
                      <TableCell>{amount.toLocaleString()} ج.م</TableCell>
                      <TableCell>
                        <Badge variant="outline">{percentage}%</Badge>
                      </TableCell>
                      <TableCell>{count}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* التقرير الشهري */}
      {reportType === "monthly" && (
        <Card>
          <CardHeader>
            <CardTitle>التقرير الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشهر</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>عدد المصروفات</TableHead>
                  <TableHead>متوسط المصروف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(monthlyBreakdown).map(([month, amount]) => {
                  const count = filteredExpenses.filter(e => 
                    format(new Date(e.date), 'yyyy-MM') === month
                  ).length;
                  const average = count > 0 ? (amount as number) / count : 0;
                  return (
                    <TableRow key={month}>
                      <TableCell className="font-medium">{month}</TableCell>
                      <TableCell>{amount.toLocaleString()} ج.م</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>{average.toLocaleString()} ج.م</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}