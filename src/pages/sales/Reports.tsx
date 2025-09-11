import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Calendar as CalendarIcon, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LocalDataManager } from "@/utils/localData";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SalesReports() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Current date
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [salesAnalytics, setSalesAnalytics] = useState<any>(null);

  useEffect(() => {
    // حساب بداية ونهاية الشهر المحدد
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    // جلب تحليلات المبيعات مع ربطها بالعملاء وفواتير البيع
    const analytics = LocalDataManager.getSalesAnalytics(startOfMonth, endOfMonth);
    
    // ربط بيانات العملاء مع فواتيرهم
    const customers = LocalDataManager.getCustomers();
    const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
    
    // إضافة معلومات العملاء والفواتير
    const enhancedAnalytics = {
      ...analytics,
      customerAnalysis: getCustomerAnalysis(customers, salesInvoices, startOfMonth, endOfMonth),
      recentInvoices: getRecentInvoices(salesInvoices, startOfMonth, endOfMonth)
    };
    
    setSalesAnalytics(enhancedAnalytics);
  }, [selectedDate]);

  // تحليل العملاء وربطهم بالفواتير
  const getCustomerAnalysis = (customers: any[], invoices: any[], startDate: Date, endDate: Date) => {
    return customers.map(customer => {
      const customerInvoices = invoices.filter(invoice => 
        invoice.customerName === customer.name || invoice.customerId === customer.id?.toString()
      ).filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
      
      const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalOrders = customerInvoices.length;
      const lastOrder = customerInvoices.length > 0 
        ? customerInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null;
      
      return {
        ...customer,
        totalSpent,
        totalOrders,
        lastOrder,
        avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      };
    }).filter(customer => customer.totalOrders > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);
  };

  // جلب الفواتير الحديثة
  const getRecentInvoices = (invoices: any[], startDate: Date, endDate: Date) => {
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  if (!salesAnalytics) {
    return <div>جاري التحميل...</div>;
  }

  const { totalSales, totalOrders, totalRevenue, avgOrderValue, monthlyData, topProducts, topCustomers, customerAnalysis, recentInvoices } = salesAnalytics;
  
  const totalCustomersCount = LocalDataManager.getCustomers().length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mada-heading text-foreground">تقارير المبيعات</h1>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-sm">
              <CalendarIcon className="h-4 w-4 ml-1" />
              {(() => {
                const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
                return `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
              })()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{(totalSales || 0).toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              إجمالي المبيعات للشهر المحدد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              عدد الطلبات للشهر المحدد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{(avgOrderValue || 0).toFixed(0)} ج.م</div>
            <p className="text-xs text-muted-foreground">لكل طلب</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{totalCustomersCount}</div>
            <p className="text-xs text-muted-foreground">عميل نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اتجاه المبيعات الشهرية</CardTitle>
          </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                 <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`, 'المبيعات']} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عدد الطلبات الشهرية</CardTitle>
          </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} طلب`, 'الطلبات']} />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="sales"
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`, 'المبيعات']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل أفضل المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{product.name}</span>
                  </div>
                   <div className="text-left">
                     <div className="font-bold">{(product.sales || 0).toLocaleString()} ج.م</div>
                     <div className="text-sm text-muted-foreground">{product.percentage || 0}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Analysis Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تحليل العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerAnalysis && customerAnalysis.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>إجمالي الطلبات</TableHead>
                      <TableHead>إجمالي المبيعات</TableHead>
                      <TableHead>متوسط الطلب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerAnalysis.slice(0, 5).map((customer: any) => (
                      <TableRow key={customer.id || customer.name}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>{customer.totalSpent.toLocaleString()} ج.م</TableCell>
                        <TableCell>{customer.avgOrderValue.toFixed(0)} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">لا توجد بيانات عملاء للشهر المحدد</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الفواتير الحديثة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices && recentInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>القيمة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.slice(0, 5).map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {invoice.invoiceNumber || invoice.id}
                          </div>
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{(invoice.total || 0).toLocaleString()} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">لا توجد فواتير للشهر المحدد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}