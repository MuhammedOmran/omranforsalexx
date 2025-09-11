import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Receipt, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Calendar
} from "lucide-react";
import { checksManager } from "@/utils/checksManager";
import { cn } from "@/lib/utils";

interface CheckReportData {
  summary: {
    total: number;
    totalAmount: number;
    pending: number;
    pendingAmount: number;
    cashed: number;
    cashedAmount: number;
    bounced: number;
    bouncedAmount: number;
    collectionRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    received: number;
    cashed: number;
    bounced: number;
    amount: number;
  }>;
  customerAnalysis: Array<{
    customerName: string;
    checksCount: number;
    totalAmount: number;
    collectionRate: number;
    averageAmount: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export function ChecksReport() {
  const [reportData, setReportData] = useState<CheckReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    customer: ''
  });

  useEffect(() => {
    generateReport();
  }, [filters]);

  const generateReport = () => {
    setLoading(true);
    try {
      const checks = checksManager.getChecks();
      let filteredChecks = checks;

      // تطبيق الفلاتر
      if (filters.dateFrom) {
        filteredChecks = filteredChecks.filter(check => 
          new Date(check.dateReceived) >= new Date(filters.dateFrom)
        );
      }
      if (filters.dateTo) {
        filteredChecks = filteredChecks.filter(check => 
          new Date(check.dateReceived) <= new Date(filters.dateTo)
        );
      }
      if (filters.status !== 'all') {
        filteredChecks = filteredChecks.filter(check => check.status === filters.status);
      }
      if (filters.customer) {
        filteredChecks = filteredChecks.filter(check => 
          check.customerName.toLowerCase().includes(filters.customer.toLowerCase())
        );
      }

      // إعداد البيانات
      const summary = calculateSummary(filteredChecks);
      const monthlyTrends = calculateMonthlyTrends(filteredChecks);
      const customerAnalysis = calculateCustomerAnalysis(filteredChecks);
      const statusBreakdown = calculateStatusBreakdown(filteredChecks);

      setReportData({
        summary,
        monthlyTrends,
        customerAnalysis,
        statusBreakdown
      });
    } catch (error) {
      console.error('خطأ في إنشاء تقرير الشيكات:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (checks: any[]) => {
    const total = checks.length;
    const totalAmount = checks.reduce((sum, check) => sum + check.amount, 0);
    
    const pending = checks.filter(c => c.status === 'pending');
    const cashed = checks.filter(c => c.status === 'cashed');
    const bounced = checks.filter(c => c.status === 'bounced');
    
    const pendingAmount = pending.reduce((sum, check) => sum + check.amount, 0);
    const cashedAmount = cashed.reduce((sum, check) => sum + check.amount, 0);
    const bouncedAmount = bounced.reduce((sum, check) => sum + check.amount, 0);
    
    const collectionRate = total > 0 ? (cashed.length / total) * 100 : 0;

    return {
      total,
      totalAmount,
      pending: pending.length,
      pendingAmount,
      cashed: cashed.length,
      cashedAmount,
      bounced: bounced.length,
      bouncedAmount,
      collectionRate
    };
  };

  const calculateMonthlyTrends = (checks: any[]) => {
    const monthlyData: { [key: string]: any } = {};
    
    checks.forEach(check => {
      const month = new Date(check.dateReceived).toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { received: 0, cashed: 0, bounced: 0, amount: 0 };
      }
      
      monthlyData[month].received++;
      monthlyData[month].amount += check.amount;
      
      if (check.status === 'cashed') monthlyData[month].cashed++;
      if (check.status === 'bounced') monthlyData[month].bounced++;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data as any
    }));
  };

  const calculateCustomerAnalysis = (checks: any[]) => {
    const customerData: { [key: string]: any } = {};
    
    checks.forEach(check => {
      if (!customerData[check.customerName]) {
        customerData[check.customerName] = {
          checksCount: 0,
          totalAmount: 0,
          cashedCount: 0
        };
      }
      
      customerData[check.customerName].checksCount++;
      customerData[check.customerName].totalAmount += check.amount;
      if (check.status === 'cashed') {
        customerData[check.customerName].cashedCount++;
      }
    });

    return Object.entries(customerData).map(([customerName, data]: [string, any]) => ({
      customerName,
      checksCount: data.checksCount,
      totalAmount: data.totalAmount,
      collectionRate: (data.cashedCount / data.checksCount) * 100,
      averageAmount: data.totalAmount / data.checksCount
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const calculateStatusBreakdown = (checks: any[]) => {
    const statusData = [
      { status: 'pending', label: 'معلق', count: 0, amount: 0 },
      { status: 'cashed', label: 'محصل', count: 0, amount: 0 },
      { status: 'bounced', label: 'مرتد', count: 0, amount: 0 }
    ];

    checks.forEach(check => {
      const statusItem = statusData.find(s => s.status === check.status);
      if (statusItem) {
        statusItem.count++;
        statusItem.amount += check.amount;
      }
    });

    const total = checks.length;
    return statusData.map(item => ({
      status: item.label,
      count: item.count,
      amount: item.amount,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));
  };

  const exportReport = () => {
    // يمكن إضافة منطق التصدير هنا
    console.log('تصدير التقرير', reportData);
  };

  if (loading || !reportData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">تقرير الشيكات</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تقرير الشيكات</h1>
          <p className="text-muted-foreground">تحليل شامل لأداء الشيكات</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* فلاتر التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="cashed">محصل</SelectItem>
                  <SelectItem value="bounced">مرتد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">العميل</Label>
              <Input
                id="customer"
                placeholder="اسم العميل"
                value={filters.customer}
                onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشيكات</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.total}</div>
            <p className="text-xs text-muted-foreground">
              القيمة: {reportData.summary.totalAmount.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التحصيل</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.summary.collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.summary.cashed} من {reportData.summary.total} شيك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المحصل</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.summary.cashedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">جنيه مصري</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المعلق</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {reportData.summary.pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">جنيه مصري</p>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل التقرير */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">تفصيل الحالات</TabsTrigger>
          <TabsTrigger value="customers">تحليل العملاء</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات الشهرية</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>تفصيل حالات الشيكات</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحالة</TableHead>
                    <TableHead>العدد</TableHead>
                    <TableHead>النسبة</TableHead>
                    <TableHead>القيمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.statusBreakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.status}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.percentage.toFixed(1)}%</TableCell>
                      <TableCell>{item.amount.toLocaleString()} ج.م</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>تحليل أداء العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>عدد الشيكات</TableHead>
                    <TableHead>إجمالي القيمة</TableHead>
                    <TableHead>متوسط القيمة</TableHead>
                    <TableHead>معدل التحصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.customerAnalysis.slice(0, 10).map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.customerName}</TableCell>
                      <TableCell>{customer.checksCount}</TableCell>
                      <TableCell>{customer.totalAmount.toLocaleString()} ج.م</TableCell>
                      <TableCell>{customer.averageAmount.toLocaleString()} ج.م</TableCell>
                      <TableCell>
                        <Badge variant={customer.collectionRate >= 80 ? 'default' : customer.collectionRate >= 60 ? 'secondary' : 'destructive'}>
                          {customer.collectionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>الاتجاهات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر</TableHead>
                    <TableHead>المستقبل</TableHead>
                    <TableHead>المحصل</TableHead>
                    <TableHead>المرتد</TableHead>
                    <TableHead>إجمالي القيمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.monthlyTrends.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell>{month.received}</TableCell>
                      <TableCell className="text-green-600">{month.cashed}</TableCell>
                      <TableCell className="text-red-600">{month.bounced}</TableCell>
                      <TableCell>{month.amount.toLocaleString()} ج.م</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}