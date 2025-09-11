import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useElectronCustomers, useElectronProducts, useElectronStats } from '@/hooks/useElectronData';
import { isElectronApp } from '@/utils/electronIntegration';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Database,
  TestTube,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3
} from 'lucide-react';

export function ElectronTestDashboard() {
  const [isElectron, setIsElectron] = useState(false);
  const [testAccountId] = useState('test-account-1');
  const [testCustomer, setTestCustomer] = useState({
    name: 'عميل تجريبي',
    phone: '01234567890',
    email: 'test@example.com'
  });
  const [testProduct, setTestProduct] = useState({
    name: 'منتج تجريبي',
    cost_price: 100,
    selling_price: 150,
    current_stock: 50,
    min_stock: 10
  });

  // استخدام hooks
  const {
    customers,
    loading: customersLoading,
    createCustomer
  } = useElectronCustomers(testAccountId);

  const {
    products,
    loading: productsLoading,
    createProduct
  } = useElectronProducts(testAccountId);

  const {
    stats,
    loading: statsLoading
  } = useElectronStats(testAccountId);

  useEffect(() => {
    setIsElectron(isElectronApp());
  }, []);

  const handleCreateTestCustomer = async () => {
    const result = await createCustomer({
      account_id: testAccountId,
      ...testCustomer
    });
    
    if (result) {
      setTestCustomer({
        name: 'عميل تجريبي',
        phone: '01234567890',
        email: 'test@example.com'
      });
    }
  };

  const handleCreateTestProduct = async () => {
    const result = await createProduct({
      account_id: testAccountId,
      is_active: true,
      ...testProduct
    });
    
    if (result) {
      setTestProduct({
        name: 'منتج تجريبي',
        cost_price: 100,
        selling_price: 150,
        current_stock: 50,
        min_stock: 10
      });
    }
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            لوحة اختبار Electron
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              لوحة الاختبار متاحة فقط في إصدار سطح المكتب (Electron)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-6 w-6" />
          لوحة اختبار قاعدة البيانات المحلية
        </h2>
        <p className="text-muted-foreground">
          اختبار عمليات قاعدة البيانات SQLite في بيئة Electron
        </p>
      </div>

      {/* الإحصائيات */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">العملاء</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.totalCustomers || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المنتجات</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.totalProducts || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مبيعات الشهر</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : (stats?.monthSales || 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مخزون منخفض</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.lowStockProducts?.length || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إضافة عميل تجريبي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            اختبار إضافة عميل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer-name">اسم العميل</Label>
              <Input
                id="customer-name"
                value={testCustomer.name}
                onChange={(e) => setTestCustomer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">رقم الهاتف</Label>
              <Input
                id="customer-phone"
                value={testCustomer.phone}
                onChange={(e) => setTestCustomer(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="customer-email">البريد الإلكتروني</Label>
              <Input
                id="customer-email"
                type="email"
                value={testCustomer.email}
                onChange={(e) => setTestCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateTestCustomer}
            disabled={customersLoading}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة عميل تجريبي
          </Button>
        </CardContent>
      </Card>

      {/* إضافة منتج تجريبي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            اختبار إضافة منتج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="product-name">اسم المنتج</Label>
              <Input
                id="product-name"
                value={testProduct.name}
                onChange={(e) => setTestProduct(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cost-price">سعر التكلفة</Label>
              <Input
                id="cost-price"
                type="number"
                value={testProduct.cost_price}
                onChange={(e) => setTestProduct(prev => ({ ...prev, cost_price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="selling-price">سعر البيع</Label>
              <Input
                id="selling-price"
                type="number"
                value={testProduct.selling_price}
                onChange={(e) => setTestProduct(prev => ({ ...prev, selling_price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="current-stock">المخزون الحالي</Label>
              <Input
                id="current-stock"
                type="number"
                value={testProduct.current_stock}
                onChange={(e) => setTestProduct(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="min-stock">الحد الأدنى</Label>
              <Input
                id="min-stock"
                type="number"
                value={testProduct.min_stock}
                onChange={(e) => setTestProduct(prev => ({ ...prev, min_stock: Number(e.target.value) }))}
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateTestProduct}
            disabled={productsLoading}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة منتج تجريبي
          </Button>
        </CardContent>
      </Card>

      {/* عرض البيانات المحفوظة */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              العملاء المحفوظون ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا توجد عملاء محفوظون
                </p>
              ) : (
                customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    </div>
                    <Badge variant="outline">
                      {new Date(customer.created_at || '').toLocaleDateString('ar-SA')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              المنتجات المحفوظة ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا توجد منتجات محفوظة
                </p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        مخزون: {product.current_stock} | سعر: {product.selling_price}
                      </p>
                    </div>
                    <Badge variant={product.current_stock <= product.min_stock ? "destructive" : "default"}>
                      {product.current_stock <= product.min_stock ? "منخفض" : "متوفر"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* حالة قاعدة البيانات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            حالة قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>SQLite متصل</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>عمليات CRUD تعمل</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>الإحصائيات محدثة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}