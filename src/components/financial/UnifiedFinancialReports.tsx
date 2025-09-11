import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { customerIntegrationManager } from '@/utils/customerIntegrationManager';
import { supplierIntegrationManager } from '@/utils/supplierIntegrationManager';
import { checksManager } from '@/utils/checksManager';
import { installmentsManager } from '@/utils/installmentsManager';
import { cashFlowManager } from '@/utils/cashFlowManager';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  Truck, 
  CreditCard, 
  Receipt, 
  AlertTriangle,
  Calendar,
  DollarSign
} from 'lucide-react';

export function UnifiedFinancialReports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    generateUnifiedReport();
  }, []);

  const generateUnifiedReport = async () => {
    setLoading(true);
    try {
      // Customer analytics
      const topCustomers = customerIntegrationManager.getTopCustomers(10);
      const overdueCustomers = customerIntegrationManager.getOverdueCustomers();
      const customersWithChecks = customerIntegrationManager.getCustomersWithPendingChecks();

      // Supplier analytics
      const supplierReport = supplierIntegrationManager.getSupplierPerformanceReport();
      const topSuppliers = supplierIntegrationManager.getTopSuppliers(10);
      const suppliersWithDebt = supplierIntegrationManager.getSuppliersWithDebt();

      // Check analytics
      const checkStats = checksManager.getCheckStatistics();
      const overdueChecks = checksManager.getOverdueChecks();
      const checksDueSoon = checksManager.getChecksDueSoon();

      // Installment analytics
      const installmentStats = installmentsManager.getInstallmentStatistics();
      const overdueInstallments = installmentsManager.getOverdueInstallments();
      const installmentsDueSoon = installmentsManager.getInstallmentsDueSoon();

      // Cash flow overview
      const transactions = cashFlowManager.getTransactions();
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const cashFlow = {
        totalIncome,
        totalExpenses,
        currentBalance: totalIncome - totalExpenses
      };

      setReportData({
        customers: {
          top: topCustomers,
          overdue: overdueCustomers,
          withChecks: customersWithChecks
        },
        suppliers: {
          report: supplierReport,
          top: topSuppliers,
          withDebt: suppliersWithDebt
        },
        checks: {
          stats: checkStats,
          overdue: overdueChecks,
          dueSoon: checksDueSoon
        },
        installments: {
          stats: installmentStats,
          overdue: overdueInstallments,
          dueSoon: installmentsDueSoon
        },
        cashFlow
      });
    } catch (error) {
      console.error('Error generating unified report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">جاري إنشاء التقرير الموحد...</div>;
  }

  if (!reportData) {
    return <div className="p-4">لا توجد بيانات متاحة</div>;
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الملخص التنفيذي للوضع المالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(reportData.cashFlow.totalIncome)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الإيرادات</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.cashFlow.totalExpenses)}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي المصروفات</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportData.cashFlow.currentBalance)}
              </div>
              <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(
                  reportData.checks.stats.totalPendingAmount + 
                  reportData.installments.stats.totalRemaining
                )}
              </div>
              <div className="text-sm text-muted-foreground">المبالغ المعلقة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {(reportData.customers.overdue.length > 0 || 
        reportData.checks.overdue.length > 0 || 
        reportData.installments.overdue.length > 0) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تنبيهات عاجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportData.customers.overdue.length > 0 && (
                <div className="p-4 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">عملاء متأخرون</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{reportData.customers.overdue.length}</div>
                  <div className="text-sm text-muted-foreground">عميل متأخر في السداد</div>
                </div>
              )}
              
              {reportData.checks.overdue.length > 0 && (
                <div className="p-4 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Receipt className="h-4 w-4" />
                    <span className="font-medium">شيكات متأخرة</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{reportData.checks.overdue.length}</div>
                  <div className="text-sm text-muted-foreground">شيك متأخر الاستحقاق</div>
                </div>
              )}
              
              {reportData.installments.overdue.length > 0 && (
                <div className="p-4 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">أقساط متأخرة</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{reportData.installments.overdue.length}</div>
                  <div className="text-sm text-muted-foreground">قسط متأخر السداد</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="suppliers">الموردين</TabsTrigger>
          <TabsTrigger value="checks">الشيكات</TabsTrigger>
          <TabsTrigger value="installments">الأقساط</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  أفضل العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.customers.top.slice(0, 5).map((customer: any, index: number) => (
                    <div key={customer.customerId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">العميل #{customer.customerId}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.totalOrders} طلب - {customer.loyaltyPoints} نقطة
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(customer.totalSpent)}</div>
                        <Badge className={
                          customer.riskLevel === 'منخفض' ? 'bg-emerald-100 text-emerald-800' :
                          customer.riskLevel === 'متوسط' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {customer.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customers with Pending Checks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  عملاء لديهم شيكات معلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.customers.withChecks.slice(0, 5).map((customer: any) => (
                    <div key={customer.customerId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">العميل #{customer.customerId}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.pendingChecks} شيك معلق
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(customer.pendingChecksAmount)}</div>
                        <div className="text-sm text-amber-600">معلق</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  أفضل الموردين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.suppliers.top.slice(0, 5).map((supplier: any, index: number) => (
                    <div key={supplier.supplierId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">المورد #{supplier.supplierId}</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.totalOrders} طلب - {supplier.onTimeDeliveryRate.toFixed(1)}% في الوقت
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(supplier.totalSpent)}</div>
                        <Badge variant={
                          supplier.performance === 'ممتاز' ? 'default' :
                          supplier.performance === 'جيد' ? 'secondary' :
                          'destructive'
                        }>
                          {supplier.performance}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Supplier Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>نظرة عامة على أداء الموردين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {reportData.suppliers.report?.performanceBreakdown.excellent || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">موردين ممتازين</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.suppliers.report?.performanceBreakdown.good || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">موردين جيدين</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {reportData.suppliers.report?.performanceBreakdown.average || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">موردين متوسطين</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.suppliers.report?.performanceBreakdown.poor || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">موردين ضعفاء</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Checks Tab */}
        <TabsContent value="checks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الشيكات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>إجمالي الشيكات</span>
                    <span className="font-bold">{reportData.checks.stats.totalChecks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>شيكات معلقة</span>
                    <span className="font-bold text-amber-600">{reportData.checks.stats.pendingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>شيكات محصلة</span>
                    <span className="font-bold text-emerald-600">{reportData.checks.stats.cashedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>شيكات مرتجعة</span>
                    <span className="font-bold text-red-600">{reportData.checks.stats.bouncedCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المبالغ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>مبلغ الشيكات المعلقة</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(reportData.checks.stats.totalPendingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>مبلغ الشيكات المحصلة</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(reportData.checks.stats.totalCashedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>مبلغ الشيكات المرتجعة</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(reportData.checks.stats.totalBouncedAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>شيكات مستحقة قريباً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.checks.dueSoon.slice(0, 3).map((check: any) => (
                    <div key={check.id} className="p-2 bg-amber-50 rounded-lg">
                      <div className="font-medium">شيك #{check.checkNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(check.amount)} - {new Date(check.dueDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Installments Tab */}
        <TabsContent value="installments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الأقساط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>إجمالي الأقساط</span>
                    <span className="font-bold">{reportData.installments.stats.totalInstallments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أقساط نشطة</span>
                    <span className="font-bold text-blue-600">{reportData.installments.stats.activeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أقساط مكتملة</span>
                    <span className="font-bold text-emerald-600">{reportData.installments.stats.completedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أقساط متأخرة</span>
                    <span className="font-bold text-red-600">{reportData.installments.stats.overdueCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المبالغ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>إجمالي المبلغ</span>
                    <span className="font-bold">
                      {formatCurrency(reportData.installments.stats.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المدفوع</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(reportData.installments.stats.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المتبقي</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(reportData.installments.stats.totalRemaining)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المتأخر</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(reportData.installments.stats.overdueAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أقساط مستحقة قريباً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.installments.dueSoon.slice(0, 3).map((installment: any) => (
                    <div key={installment.id} className="p-2 bg-amber-50 rounded-lg">
                      <div className="font-medium">قسط #{installment.installmentNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(installment.remainingAmount)} - {new Date(installment.dueDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={generateUnifiedReport} disabled={loading}>
          تحديث التقرير
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          طباعة التقرير
        </Button>
      </div>
    </div>
  );
}