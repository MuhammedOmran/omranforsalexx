import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { 
  BookOpen, 
  Code, 
  Settings, 
  Download, 
  ExternalLink,
  FileText,
  Monitor,
  Shield,
  Users
} from 'lucide-react';

interface DocumentationViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentationViewer({ isOpen, onClose }: DocumentationViewerProps) {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] bg-background border rounded-lg shadow-lg">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-l border-border p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">الوثائق</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                ✕
              </Button>
            </div>
            
            <nav className="space-y-2">
              <Button
                variant={activeSection === 'overview' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('overview')}
              >
                <BookOpen className="ml-2 h-4 w-4" />
                نظرة عامة
              </Button>
              
              <Button
                variant={activeSection === 'user-guide' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('user-guide')}
              >
                <Users className="ml-2 h-4 w-4" />
                دليل المستخدم
              </Button>
              
              <Button
                variant={activeSection === 'api' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('api')}
              >
                <Code className="ml-2 h-4 w-4" />
                توثيق API
              </Button>
              
              <Button
                variant={activeSection === 'maintenance' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveSection('maintenance')}
              >
                <Settings className="ml-2 h-4 w-4" />
                دليل الصيانة
              </Button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <ScrollArea className="h-full">
              
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-4">وثائق نظام عُمران</h1>
                    <p className="text-lg text-muted-foreground">
                      دليلك الشامل لاستخدام وإدارة نظام عُمران
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="ml-2 h-5 w-5" />
                          دليل المستخدم
                        </CardTitle>
                        <CardDescription>
                          تعلم كيفية استخدام جميع ميزات النظام
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>• إدارة المبيعات والفواتير</li>
                          <li>• إدارة المخزون والمنتجات</li>
                          <li>• إدارة المشتريات والموردين</li>
                          <li>• إدارة الموظفين والرواتب</li>
                          <li>• التقارير والتحليلات</li>
                        </ul>
                        <Button 
                          className="w-full mt-4"
                          onClick={() => setActiveSection('user-guide')}
                        >
                          عرض الدليل
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Code className="ml-2 h-5 w-5" />
                          توثيق API
                        </CardTitle>
                        <CardDescription>
                          مرجع شامل لمطوري التطبيقات
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>• واجهات برمجة التطبيقات</li>
                          <li>• أمثلة الكود</li>
                          <li>• هياكل البيانات</li>
                          <li>• معالجة الأخطاء</li>
                          <li>• أفضل الممارسات</li>
                        </ul>
                        <Button 
                          className="w-full mt-4"
                          onClick={() => setActiveSection('api')}
                        >
                          عرض التوثيق
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Settings className="ml-2 h-5 w-5" />
                          دليل الصيانة
                        </CardTitle>
                        <CardDescription>
                          إرشادات للمسؤولين التقنيين
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>• التثبيت والإعداد</li>
                          <li>• المراقبة والأداء</li>
                          <li>• النسخ الاحتياطي</li>
                          <li>• استكشاف الأخطاء</li>
                          <li>• إجراءات الطوارئ</li>
                        </ul>
                        <Button 
                          className="w-full mt-4"
                          onClick={() => setActiveSection('maintenance')}
                        >
                          عرض دليل الصيانة
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Download className="ml-2 h-5 w-5" />
                          تنزيل الوثائق
                        </CardTitle>
                        <CardDescription>
                          احصل على نسخة للقراءة أوف لاين
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => downloadFile('user-guide.md', getUserGuideContent())}
                          >
                            <Download className="ml-2 h-4 w-4" />
                            دليل المستخدم
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => downloadFile('api-docs.md', getAPIDocsContent())}
                          >
                            <Download className="ml-2 h-4 w-4" />
                            توثيق API
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => downloadFile('maintenance-guide.md', getMaintenanceGuideContent())}
                          >
                            <Download className="ml-2 h-4 w-4" />
                            دليل الصيانة
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>إحصائيات النظام</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">15+</div>
                          <div className="text-sm text-muted-foreground">وحدة رئيسية</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">50+</div>
                          <div className="text-sm text-muted-foreground">API endpoint</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">100%</div>
                          <div className="text-sm text-muted-foreground">أوف لاين</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">3</div>
                          <div className="text-sm text-muted-foreground">أدلة شاملة</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* User Guide Section */}
              {activeSection === 'user-guide' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">دليل المستخدم</h1>
                    <Button
                      onClick={() => downloadFile('user-guide.md', getUserGuideContent())}
                      size="sm"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تنزيل
                    </Button>
                  </div>

                  <Tabs defaultValue="getting-started" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="getting-started">البدء</TabsTrigger>
                      <TabsTrigger value="sales">المبيعات</TabsTrigger>
                      <TabsTrigger value="inventory">المخزون</TabsTrigger>
                      <TabsTrigger value="reports">التقارير</TabsTrigger>
                    </TabsList>

                    <TabsContent value="getting-started" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>مرحباً بك في نظام عُمران</CardTitle>
                          <CardDescription>
                            ابدأ رحلتك مع النظام الأكثر تطوراً لإدارة الأعمال
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">الخطوة الأولى: تسجيل الدخول</h3>
                            <p className="text-sm text-muted-foreground">
                              ابدأ بتسجيل الدخول باستخدام بيانات حسابك أو قم بإنشاء حساب جديد.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">الإعداد الأولي</h3>
                            <p className="text-sm text-muted-foreground">
                              قم بإعداد معلومات شركتك والعملة الافتراضية من قسم الإعدادات.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">إضافة البيانات الأساسية</h3>
                            <p className="text-sm text-muted-foreground">
                              ابدأ بإضافة المنتجات والعملاء والموردين لتكون جاهزاً للعمل.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>إدارة المبيعات</CardTitle>
                          <CardDescription>
                            تعلم كيفية إدارة فواتير المبيعات والعملاء
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">إنشاء فاتورة مبيعات</h3>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                              <li>انتقل إلى قسم "المبيعات"</li>
                              <li>انقر على "فاتورة جديدة"</li>
                              <li>اختر العميل أو أضف عميل جديد</li>
                              <li>أضف المنتجات والكميات</li>
                              <li>احفظ واطبع الفاتورة</li>
                            </ol>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">إدارة العملاء</h3>
                            <p className="text-sm text-muted-foreground">
                              يمكنك إضافة وتعديل معلومات العملاء من قسم "العملاء" في المبيعات.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>إدارة المخزون</CardTitle>
                          <CardDescription>
                            إدارة المنتجات والمخزون بكفاءة عالية
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">إضافة منتج جديد</h3>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                              <li>اذهب إلى قسم "المخزون"</li>
                              <li>انقر على "منتج جديد"</li>
                              <li>أدخل معلومات المنتج</li>
                              <li>حدد الأسعار والكمية</li>
                              <li>احفظ المنتج</li>
                            </ol>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">نظام الباركود</h3>
                            <p className="text-sm text-muted-foreground">
                              يمكن إنشاء باركود تلقائياً لكل منتج أو إدخال باركود موجود.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>التقارير والتحليلات</CardTitle>
                          <CardDescription>
                            احصل على رؤى قيمة من بيانات أعمالك
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">تقارير المبيعات</h3>
                            <p className="text-sm text-muted-foreground">
                              تقارير يومية وشهرية وسنوية لأداء المبيعات مع الرسوم البيانية.
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">تقارير الأرباح</h3>
                            <p className="text-sm text-muted-foreground">
                              تحليل مفصل للأرباح والخسائر مع مقارنات الفترات.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* API Documentation Section */}
              {activeSection === 'api' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">توثيق API</h1>
                    <Button
                      onClick={() => downloadFile('api-docs.md', getAPIDocsContent())}
                      size="sm"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تنزيل
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>APIs المبيعات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="secondary">GET /customers</Badge>
                          <Badge variant="secondary">POST /invoices</Badge>
                          <Badge variant="secondary">GET /sales-reports</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>APIs المخزون</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="secondary">GET /products</Badge>
                          <Badge variant="secondary">POST /stock-movement</Badge>
                          <Badge variant="secondary">GET /low-stock</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>APIs المشتريات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="secondary">GET /suppliers</Badge>
                          <Badge variant="secondary">POST /purchase-invoice</Badge>
                          <Badge variant="secondary">GET /purchase-reports</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>APIs الموظفين</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge variant="secondary">GET /employees</Badge>
                          <Badge variant="secondary">POST /payroll</Badge>
                          <Badge variant="secondary">GET /attendance</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>مثال على الاستخدام</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`// إنشاء فاتورة مبيعات جديدة
const invoice = createInvoice({
  customerId: "customer_123",
  customerName: "أحمد محمد",
  items: [
    {
      productId: "product_456",
      productName: "منتج تجريبي",
      quantity: 2,
      unitPrice: 100,
      total: 200
    }
  ],
  total: 200,
  paymentMethod: "cash",
  status: "paid"
});

console.log("تم إنشاء الفاتورة:", invoice.id);`}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Maintenance Guide Section */}
              {activeSection === 'maintenance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">دليل الصيانة</h1>
                    <Button
                      onClick={() => downloadFile('maintenance-guide.md', getMaintenanceGuideContent())}
                      size="sm"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      تنزيل
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Monitor className="ml-2 h-5 w-5" />
                          المراقبة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          <li>• مراقبة الأداء</li>
                          <li>• استخدام الذاكرة</li>
                          <li>• مساحة التخزين</li>
                          <li>• زمن الاستجابة</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Shield className="ml-2 h-5 w-5" />
                          الأمان
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          <li>• تشفير البيانات</li>
                          <li>• مراجعة الصلاحيات</li>
                          <li>• فحص الثغرات</li>
                          <li>• سجلات الوصول</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <FileText className="ml-2 h-5 w-5" />
                          النسخ الاحتياطي
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          <li>• نسخ تلقائية</li>
                          <li>• استعادة البيانات</li>
                          <li>• التحقق من السلامة</li>
                          <li>• جدولة النسخ</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>جدول الصيانة الدورية</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-green-600">المهام اليومية</h3>
                          <ul className="text-sm space-y-1 mt-2">
                            <li>• فحص أداء النظام</li>
                            <li>• مراجعة سجلات الأخطاء</li>
                            <li>• تنظيف البيانات المؤقتة</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-600">المهام الأسبوعية</h3>
                          <ul className="text-sm space-y-1 mt-2">
                            <li>• فحص شامل للنظام</li>
                            <li>• تحسين قاعدة البيانات</li>
                            <li>• مراجعة النسخ الاحتياطية</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-600">المهام الشهرية</h3>
                          <ul className="text-sm space-y-1 mt-2">
                            <li>• تحديث النظام</li>
                            <li>• مراجعة الأمان</li>
                            <li>• تقييم الأداء</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to get content for downloads
function getUserGuideContent(): string {
  return `# دليل المستخدم - نظام عُمران

## مقدمة
نظام عُمران هو حل شامل لإدارة الأعمال...

## البدء
### تسجيل الدخول
1. افتح النظام
2. أدخل بيانات الدخول
3. ابدأ العمل

## إدارة المبيعات
### إنشاء فاتورة
1. انتقل إلى المبيعات
2. انقر على فاتورة جديدة
...

[باقي محتوى دليل المستخدم]`;
}

function getAPIDocsContent(): string {
  return `# توثيق API - نظام عُمران

## نظرة عامة
يوفر النظام مجموعة شاملة من APIs...

## APIs المبيعات
### إنشاء فاتورة
\`\`\`typescript
createInvoice(data: InvoiceData): Invoice
\`\`\`

[باقي توثيق APIs]`;
}

function getMaintenanceGuideContent(): string {
  return `# دليل الصيانة - نظام عُمران

## نظرة عامة
هذا الدليل للمسؤولين التقنيين...

## المراقبة
### مراقبة الأداء
- استخدام الذاكرة
- زمن الاستجابة
...

[باقي دليل الصيانة]`;
}