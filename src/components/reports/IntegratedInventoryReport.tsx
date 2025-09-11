import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Package, AlertTriangle, TrendingUp, Zap, FileSpreadsheet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useInventoryReport } from "@/hooks/useInventoryReport";

export function IntegratedInventoryReport() {
  const { data: inventoryData, loading } = useInventoryReport();

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير المخزون المتكامل</title>
        <style>
          body { 
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            direction: rtl; 
            margin: 0; 
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin: 0 auto;
            max-width: 1000px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #10b981; 
            padding-bottom: 30px; 
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #10b981, #059669);
            border-radius: 2px;
          }
          .title { 
            font-size: 36px; 
            font-weight: bold; 
            color: #10b981;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
          }
          .subtitle {
            font-size: 18px;
            color: #6b7280;
            font-weight: 500;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
            gap: 25px; 
            margin: 40px 0; 
          }
          .stat-card { 
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 2px solid #d1fae5; 
            border-radius: 15px; 
            padding: 25px; 
            text-align: center;
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981, #059669);
          }
          .stat-title {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 5px;
          }
          .stat-note {
            font-size: 12px;
            color: #9ca3af;
            font-style: italic;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">تقرير المخزون المتكامل</h1>
            <p class="subtitle">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">إجمالي المنتجات</div>
              <div class="stat-value">${inventoryData?.totalProducts || 0}</div>
              <div class="stat-note">منتج متوفر</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">قيمة المخزون</div>
              <div class="stat-value">${(inventoryData?.totalValue || 0).toLocaleString()} ج.م</div>
              <div class="stat-note">إجمالي القيمة</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">مخزون منخفض</div>
              <div class="stat-value">${inventoryData?.lowStockItems || 0}</div>
              <div class="stat-note">يحتاج إعادة تموين</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">نفد المخزون</div>
              <div class="stat-value">${inventoryData?.outOfStockItems || 0}</div>
              <div class="stat-note">غير متوفر</div>
            </div>
          </div>
          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المخزون</p>
            <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
          </div>
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
  };

  const exportToCSV = () => {
    if (!inventoryData) return;
    
    try {
      // إنشاء البيانات
      const csvData = [
        ['تقرير المخزون المتكامل'],
        ['تاريخ التقرير:', new Date().toLocaleDateString('ar-EG')],
        [''],
        ['الملخص العام:'],
        ['إجمالي المنتجات', inventoryData.totalProducts.toString()],
        ['قيمة المخزون (ج.م)', inventoryData.totalValue.toLocaleString()],
        ['مخزون منخفض', inventoryData.lowStockItems.toString()],
        ['نفد المخزون', inventoryData.outOfStockItems.toString()],
        [''],
        ['تفاصيل المنتجات:'],
        ['اسم المنتج', 'الفئة', 'الكمية الحالية', 'الحد الأدنى', 'التكلفة', 'القيمة الإجمالية']
      ];

      // إضافة بيانات المنتجات
      inventoryData.products.forEach(product => {
        csvData.push([
          product.name || '',
          product.category || 'غير محدد',
          product.stock?.toString() || '0',
          product.min_stock?.toString() || '5',
          product.cost?.toString() || '0',
          ((product.stock || 0) * (product.cost || 0)).toLocaleString()
        ]);
      });

      // تحويل إلى CSV مع دعم UTF-8 BOM للعربية
      const csvContent = '\ufeff' + csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // إنشاء وتحميل الملف
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('خطأ في تصدير CSV:', error);
    }
  };

  if (loading || !inventoryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo text-foreground">تقرير المخزون المتكامل</h1>
          <p className="text-muted-foreground font-tajawal">تحليل شامل لحالة المخزون والتنبيهات</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportToPDF} 
            className="font-cairo bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير كـ PDF
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline"
            className="font-cairo border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{inventoryData.totalProducts}</div>
            <p className="text-xs text-muted-foreground font-tajawal">منتج متوفر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">قيمة المخزون</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success font-tajawal">
              {inventoryData.totalValue.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajawal">إجمالي القيمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">مخزون منخفض</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning font-tajawal">{inventoryData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground font-tajawal">يحتاج إعادة تموين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">نفد المخزون</CardTitle>
            <Zap className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive font-tajawal">{inventoryData.outOfStockItems}</div>
            <p className="text-xs text-muted-foreground font-tajawal">غير متوفر</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">توزيع المخزون حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="total"
                    nameKey="category"
                  >
                    {inventoryData.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">تنبيهات المخزون المنخفض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventoryData.lowStockProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium font-tajawal">{product.name}</span>
                  <Badge variant="destructive" className="font-tajawal">كمية: {product.stock}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}