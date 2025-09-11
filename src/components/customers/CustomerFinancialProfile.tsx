import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { customerIntegrationManager } from '@/utils/customerIntegrationManager';
import { formatCurrency } from '@/lib/utils';
import { User, TrendingUp, CreditCard, Receipt, Calendar, AlertTriangle } from 'lucide-react';

interface CustomerFinancialProfileProps {
  customerId: string;
}

export function CustomerFinancialProfile({ customerId }: CustomerFinancialProfileProps) {
  const [customerReport, setCustomerReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = () => {
      try {
        const report = customerIntegrationManager.getCustomerDetailedReport(customerId);
        setCustomerReport(report);
      } catch (error) {
        logger.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  if (loading) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  if (!customerReport) {
    return <div className="p-4">لم يتم العثور على بيانات العميل</div>;
  }

  const { customer, invoices, installments, checks } = customerReport;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'منخفض': return 'bg-emerald-100 text-emerald-800';
      case 'متوسط': return 'bg-amber-100 text-amber-800';
      case 'عالي': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-emerald-100 text-emerald-800';
      case 'متأخر': return 'bg-red-100 text-red-800';
      case 'معلق': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            الملف المالي للعميل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">إجمالي المشتريات</div>
              <div className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">عدد الطلبات</div>
              <div className="text-2xl font-bold">{customer.totalOrders}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">نقاط الولاء</div>
              <div className="text-2xl font-bold text-primary">{customer.loyaltyPoints}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">المديونية</div>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(customer.totalDebt)}</div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge className={getRiskBadgeColor(customer.riskLevel)}>
              مستوى المخاطر: {customer.riskLevel}
            </Badge>
            <Badge className={getStatusBadgeColor(customer.status)}>
              الحالة: {customer.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Financial Details Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="installments">الأقساط</TabsTrigger>
          <TabsTrigger value="checks">الشيكات</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                فواتير المبيعات ({invoices.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{invoices.total}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الفواتير</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(invoices.totalAmount)}</div>
                  <div className="text-sm text-muted-foreground">إجمالي المبلغ</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(customer.averageOrderValue)}</div>
                  <div className="text-sm text-muted-foreground">متوسط الطلب</div>
                </div>
              </div>

              <div className="space-y-2">
                {invoices.data.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">فاتورة #{invoice.invoiceNumber || invoice.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(invoice.total)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installments Tab */}
        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                الأقساط ({installments.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{installments.completed}</div>
                  <div className="text-sm text-muted-foreground">مكتملة</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{installments.active}</div>
                  <div className="text-sm text-muted-foreground">نشطة</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{installments.overdue}</div>
                  <div className="text-sm text-muted-foreground">متأخرة</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{formatCurrency(customer.pendingInstallments * customer.totalSpent / customer.totalOrders)}</div>
                  <div className="text-sm text-muted-foreground">المبلغ المعلق</div>
                </div>
              </div>

              <div className="space-y-2">
                {installments.data.slice(0, 5).map((installment: any) => (
                  <div key={installment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">قسط #{installment.installmentNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        استحقاق: {new Date(installment.dueDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(installment.remainingAmount)}</div>
                      <Badge variant={installment.status === 'completed' ? 'default' : installment.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {installment.status === 'completed' ? 'مكتمل' : installment.status === 'overdue' ? 'متأخر' : 'نشط'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checks Tab */}
        <TabsContent value="checks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                الشيكات ({checks.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{checks.pending}</div>
                  <div className="text-sm text-muted-foreground">معلقة</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{checks.cashed}</div>
                  <div className="text-sm text-muted-foreground">محصلة</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{checks.bounced}</div>
                  <div className="text-sm text-muted-foreground">مرتجعة</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {formatCurrency(checks.data.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.amount, 0))}
                  </div>
                  <div className="text-sm text-muted-foreground">المبلغ المعلق</div>
                </div>
              </div>

              <div className="space-y-2">
                {checks.data.slice(0, 5).map((check: any) => (
                  <div key={check.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">شيك #{check.checkNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {check.bankName} - استحقاق: {new Date(check.dueDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(check.amount)}</div>
                      <Badge variant={
                        check.status === 'cashed' ? 'default' : 
                        check.status === 'bounced' ? 'destructive' : 
                        'secondary'
                      }>
                        {check.status === 'cashed' ? 'محصل' : 
                         check.status === 'bounced' ? 'مرتجع' : 
                         check.status === 'pending' ? 'معلق' : check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts Section */}
      {(customer.riskLevel === 'عالي' || customer.status === 'متأخر' || installments.overdue > 0) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تنبيهات مهمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customer.riskLevel === 'عالي' && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>العميل لديه مستوى مخاطر عالي</span>
                </div>
              )}
              {customer.status === 'متأخر' && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>العميل متأخر في السداد</span>
                </div>
              )}
              {installments.overdue > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>يوجد {installments.overdue} أقساط متأخرة</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}