import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  ShoppingCart,
  FileText,
  BarChart3,
  Shield,
  Lock
} from "lucide-react";
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/AuthContext';
import ProductForm from './ProductForm';
import InventoryMovementForm from './InventoryMovementForm';
import InvoiceForm from './InvoiceForm';
import InventoryReport from './InventoryReport';

const SecureInventoryDashboard = () => {
  const { user, hasPermission } = useAuth();
  const {
    products,
    inventory,
    movements,
    invoices,
    productsLoading,
    inventoryLoading,
    movementsLoading,
    invoicesLoading
  } = useInventory();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // تصفية البيانات حسب البحث
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = inventory.filter(item =>
    item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إحصائيات المخزون
  const totalProducts = products.length;
  const lowStockItems = inventory.filter(item => 
    item.current_stock <= (item.product?.min_stock_level || 0)
  ).length;
  const outOfStockItems = inventory.filter(item => item.current_stock <= 0).length;
  const totalValue = inventory.reduce((sum, item) => 
    sum + (item.current_stock * (item.product?.unit_price || 0)), 0
  );

  // التحقق من الصلاحيات
  const canManageProducts = hasPermission('inventory.manage') || hasPermission('admin');
  const canViewReports = hasPermission('reports.view') || hasPermission('admin');
  const canCreateInvoices = hasPermission('sales.create') || hasPermission('admin');

  if (productsLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات المحمية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* رأس الصفحة مع مؤشرات الأمان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-green-600" />
            نظام إدارة المخزون المحمي
          </h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <Lock className="h-4 w-4" />
            محمي بنظام RLS - مستخدم: {user?.name}
          </p>
        </div>
        
        <div className="flex gap-2">
          {canManageProducts && (
            <Button onClick={() => setShowProductForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Button>
          )}
          {canCreateInvoices && (
            <Button onClick={() => setShowInvoiceForm(true)} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              فاتورة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* البحث والتصفية */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="البحث في المنتجات والمخزون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          تصفية
        </Button>
        {canViewReports && (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        )}
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">منتج نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()} ر.س</div>
            <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">منتج بحاجة إعادة تزويد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نفد المخزون</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">منتج غير متوفر</p>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="movements">حركة المخزون</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* المنتجات منخفضة المخزون */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  تنبيهات المخزون
                </CardTitle>
                <CardDescription>المنتجات التي تحتاج إعادة تزويد</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventory
                    .filter(item => item.current_stock <= (item.product?.min_stock_level || 0))
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">كود: {item.product?.sku}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={item.current_stock <= 0 ? "destructive" : "secondary"}>
                            {item.current_stock} قطعة
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* أحدث الفواتير */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  أحدث الفواتير
                </CardTitle>
                <CardDescription>آخر العمليات المسجلة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">فاتورة #{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customer_name || 'عميل نقدي'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{invoice.net_amount.toLocaleString()} ر.س</p>
                        <Badge variant={
                          invoice.status === 'confirmed' ? 'default' : 
                          invoice.status === 'paid' ? 'secondary' : 'outline'
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المنتجات</CardTitle>
              <CardDescription>عرض وإدارة جميع المنتجات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>كود: {product.sku}</span>
                        <span>السعر: {product.unit_price.toLocaleString()} ر.س</span>
                        <span>التكلفة: {product.cost_price.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                      {canManageProducts && (
                        <Button variant="outline" size="sm">تعديل</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>حالة المخزون</CardTitle>
              <CardDescription>مراقبة كميات المخزون الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product?.name}</h3>
                      <p className="text-sm text-muted-foreground">كود: {item.product?.sku}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">متوفر:</span>
                        <Badge variant={
                          item.current_stock <= 0 ? "destructive" : 
                          item.current_stock <= (item.product?.min_stock_level || 0) ? "secondary" : "default"
                        }>
                          {item.current_stock} قطعة
                        </Badge>
                      </div>
                      {item.reserved_stock > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">محجوز:</span>
                          <span className="text-sm">{item.reserved_stock} قطعة</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">حركة المخزون</h2>
            {canManageProducts && (
              <Button onClick={() => setShowMovementForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة حركة
              </Button>
            )}
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="space-y-2">
                {movements.slice(0, 20).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <h3 className="font-medium">{movement.product?.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>النوع: {movement.movement_type}</span>
                        <span>المرجع: {movement.reference_type || 'يدوي'}</span>
                        <span>{new Date(movement.created_at).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-medium ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                      {movement.total_amount && (
                        <p className="text-sm text-muted-foreground">
                          {movement.total_amount.toLocaleString()} ر.س
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {canViewReports ? (
            <InventoryReport />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">غير مصرح</h3>
                  <p className="text-muted-foreground">ليس لديك صلاحية لعرض التقارير</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* النماذج المنبثقة */}
      {showProductForm && (
        <ProductForm onClose={() => setShowProductForm(false)} />
      )}
      
      {showMovementForm && (
        <InventoryMovementForm onClose={() => setShowMovementForm(false)} />
      )}
      
      {showInvoiceForm && (
        <InvoiceForm onClose={() => setShowInvoiceForm(false)} />
      )}
    </div>
  );
};

export default SecureInventoryDashboard;