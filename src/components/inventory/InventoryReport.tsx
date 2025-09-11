import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3, TrendingUp, TrendingDown, Package, FileText, Eye, EyeOff, ChevronDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";


interface InventoryReportData {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_level: number;
  unit_price: number;
  total_value: number;
  stock_status: string;
}

const InventoryReport: React.FC = () => {
  const [reportData, setReportData] = useState<InventoryReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayOptions, setDisplayOptions] = useState({
    showSellPrice: false,
    showBuyPrice: false,
    showQuantity: true
  });
  const { toast } = useToast();

  const fetchReport = async () => {
    setLoading(true);
    try {
      // استخدام localStorage كبديل لـ Supabase
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const movements = JSON.parse(localStorage.getItem('inventoryMovements') || '[]');
      
      // إنشاء تقرير من البيانات المحلية
      const formattedData = products.map((product: any) => {
        const productMovements = movements.filter((m: any) => m.productId === product.id);
        const currentStock = productMovements.reduce((total: number, movement: any) => {
          return movement.type === 'in' ? total + movement.quantity : total - movement.quantity;
        }, product.quantity || 0);
        
        return {
          ...product,
          current_stock: currentStock,
          min_stock_level: product.minQuantity || 0,
          stock_status: currentStock <= (product.minQuantity || 0) ? 'منخفض' : 'جيد'
        };
      });
      
      setReportData(formattedData);
    } catch (error: any) {
      toast({
        title: "خطأ في جلب التقرير",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportToCsv = () => {
    const headers = [
      'اسم المنتج',
      'الكود',
      'المخزون الحالي',
      'المخزون المحجوز',
      'المخزون المتاح',
      'الحد الأدنى',
      'سعر الوحدة',
      'القيمة الإجمالية',
      'حالة المخزون'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.product_name,
        row.sku,
        row.current_stock,
        row.reserved_stock,
        row.available_stock,
        row.min_stock_level,
        row.unit_price,
        row.total_value,
        row.stock_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    // حساب الإحصائيات الإضافية
    const lowStockProducts = reportData.filter(item => item.stock_status === 'منخفض');
    const outOfStockProducts = reportData.filter(item => item.stock_status === 'نفد');
    const availableProducts = reportData.filter(item => item.stock_status === 'متوفر');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير المخزون</title>
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
          .status-available { color: #10b981; font-weight: bold; }
          .status-low { color: #f59e0b; font-weight: bold; }
          .status-out { color: #ef4444; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير المخزون الشامل</h1>
          <div class="subtitle">تحليل شامل لحالة المخزون والمنتجات</div>
          <div class="info">
            <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
            <div>آخر تحديث: ${new Date().toLocaleString('en-GB')}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">الملخص التنفيذي</h2>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">إجمالي قيمة المخزون:</span>
              <span>${totalValue.toLocaleString()} ر.س</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">عدد المنتجات المتوفرة:</span>
              <span class="status-available">${availableCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">عدد المنتجات منخفضة المخزون:</span>
              <span class="status-low">${lowStockCount}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">عدد المنتجات النافدة:</span>
              <span class="status-out">${outOfStockCount}</span>
            </div>
          </div>
        </div>

        ${reportData.length > 0 ? `
        <div class="section">
          <h2 class="section-title">تفاصيل المخزون</h2>
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الكود</th>
                <th>المخزون الحالي</th>
                <th>محجوز</th>
                <th>متاح</th>
                <th>الحد الأدنى</th>
                <th>سعر الوحدة (ر.س)</th>
                <th>القيمة الإجمالية (ر.س)</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.sku}</td>
                  <td>${item.current_stock}</td>
                  <td>${item.reserved_stock}</td>
                  <td>${item.available_stock}</td>
                  <td>${item.min_stock_level}</td>
                  <td>${item.unit_price.toLocaleString()}</td>
                  <td>${item.total_value.toLocaleString()}</td>
                  <td class="status-${item.stock_status === 'متوفر' ? 'available' : item.stock_status === 'منخفض' ? 'low' : 'out'}">${item.stock_status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${lowStockProducts.length > 0 ? `
        <div class="section">
          <h2 class="section-title">تحذيرات المخزون المنخفض</h2>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>المخزون الحالي</th>
                <th>الحد الأدنى</th>
                <th>الكمية المطلوبة</th>
              </tr>
            </thead>
            <tbody>
              ${lowStockProducts.map(product => `
                <tr>
                  <td>${product.product_name}</td>
                  <td class="status-low">${product.current_stock}</td>
                  <td>${product.min_stock_level}</td>
                  <td>${Math.max(0, product.min_stock_level - product.current_stock)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${outOfStockProducts.length > 0 ? `
        <div class="section">
          <h2 class="section-title">المنتجات النافدة</h2>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكود</th>
                <th>الحد الأدنى المطلوب</th>
              </tr>
            </thead>
            <tbody>
              ${outOfStockProducts.map(product => `
                <tr>
                  <td>${product.product_name}</td>
                  <td>${product.sku}</td>
                  <td class="status-out">${product.min_stock_level}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <h2 class="section-title">تحليل الأداء والتوصيات</h2>
          <ul style="list-style-type: disc; padding-right: 20px;">
            <li>نسبة المنتجات المتوفرة: ${reportData.length > 0 ? ((availableCount / reportData.length) * 100).toFixed(1) : 0}%</li>
            <li>نسبة المنتجات منخفضة المخزون: ${reportData.length > 0 ? ((lowStockCount / reportData.length) * 100).toFixed(1) : 0}%</li>
            <li>نسبة المنتجات النافدة: ${reportData.length > 0 ? ((outOfStockCount / reportData.length) * 100).toFixed(1) : 0}%</li>
            ${lowStockCount > 0 ? '<li>يُنصح بتزويد المنتجات منخفضة المخزون في أقرب وقت</li>' : ''}
            ${outOfStockCount > 0 ? '<li>ضرورة طلب المنتجات النافدة فوراً لتجنب فقدان المبيعات</li>' : ''}
            ${availableCount === reportData.length ? '<li>ممتاز! جميع المنتجات متوفرة بكميات كافية</li>' : ''}
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
            }
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast({
      title: "تم تحضير التقرير بنجاح",
      description: "تم تحضير تقرير المخزون للطباعة بنجاح",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'نفد': return 'destructive';
      case 'منخفض': return 'secondary';
      case 'متوفر': return 'default';
      default: return 'outline';
    }
  };

  const totalValue = reportData.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockCount = reportData.filter(item => item.stock_status === 'منخفض').length;
  const outOfStockCount = reportData.filter(item => item.stock_status === 'نفد').length;
  const availableCount = reportData.filter(item => item.stock_status === 'متوفر').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  // إضافة console log للتأكد من عرض المكون
  console.log('InventoryReport component rendering - PDF button should be visible');
  
  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس التقرير */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            تقرير المخزون الشامل
          </h2>
          <p className="text-muted-foreground mt-1">
            آخر تحديث: {new Date().toLocaleString('ar-SA')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchReport} variant="outline">
            تحديث
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                خيارات العرض
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-sm border shadow-lg z-50">
              <DropdownMenuLabel>اختر المعلومات المراد عرضها</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={displayOptions.showQuantity}
                onCheckedChange={(checked) => 
                  setDisplayOptions(prev => ({ ...prev, showQuantity: checked || false }))
                }
              >
                عرض الكميات
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={displayOptions.showBuyPrice}
                onCheckedChange={(checked) => 
                  setDisplayOptions(prev => ({ ...prev, showBuyPrice: checked || false }))
                }
              >
                عرض أسعار الشراء
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={displayOptions.showSellPrice}
                onCheckedChange={(checked) => 
                  setDisplayOptions(prev => ({ ...prev, showSellPrice: checked || false }))
                }
              >
                عرض أسعار البيع
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">قيمة المخزون الحالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوفر</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <p className="text-xs text-muted-foreground">منتج متوفر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">منتج بحاجة تزويد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نفد المخزون</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">منتج غير متوفر</p>
          </CardContent>
        </Card>
      </div>

      {/* جدول التقرير التفصيلي */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المخزون</CardTitle>
          <CardDescription>
            عرض تفصيلي لحالة جميع المنتجات في المخزون
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-3 font-medium">المنتج</th>
                  <th className="text-right p-3 font-medium">الكود</th>
                  {displayOptions.showQuantity && <th className="text-center p-3 font-medium">المخزون الحالي</th>}
                  {displayOptions.showQuantity && <th className="text-center p-3 font-medium">محجوز</th>}
                  {displayOptions.showQuantity && <th className="text-center p-3 font-medium">متاح</th>}
                  {displayOptions.showQuantity && <th className="text-center p-3 font-medium">الحد الأدنى</th>}
                  {displayOptions.showBuyPrice && <th className="text-right p-3 font-medium">سعر الشراء</th>}
                  {displayOptions.showSellPrice && <th className="text-right p-3 font-medium">سعر البيع</th>}
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item) => (
                  <tr key={item.product_id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.sku}</td>
                    {displayOptions.showQuantity && <td className="p-3 text-center font-medium">{item.current_stock}</td>}
                    {displayOptions.showQuantity && <td className="p-3 text-center text-muted-foreground">{item.reserved_stock}</td>}
                    {displayOptions.showQuantity && <td className="p-3 text-center">{item.available_stock}</td>}
                    {displayOptions.showQuantity && <td className="p-3 text-center text-muted-foreground">{item.min_stock_level}</td>}
                    {displayOptions.showBuyPrice && <td className="p-3">{item.unit_price.toLocaleString()} ر.س</td>}
                    {displayOptions.showSellPrice && <td className="p-3 font-medium">{(item.unit_price * 1.3).toLocaleString()} ر.س</td>}
                    <td className="p-3 text-center">
                      <Badge variant={getStatusBadgeVariant(item.stock_status)}>
                        {item.stock_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد بيانات للعرض</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;