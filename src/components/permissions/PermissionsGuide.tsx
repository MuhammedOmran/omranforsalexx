import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  ShoppingCart, 
  Package, 
  FileText, 
  Settings,
  BarChart3,
  CreditCard,
  Truck,
  Info
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PERMISSION_CATEGORIES = [
  {
    id: 'users',
    name: 'إدارة المستخدمين',
    icon: Users,
    color: 'text-blue-600',
    permissions: [
      { name: 'users.create', desc: 'إضافة مستخدمين جدد' },
      { name: 'users.read', desc: 'عرض قائمة المستخدمين' },
      { name: 'users.update', desc: 'تعديل بيانات المستخدمين' },
      { name: 'users.delete', desc: 'حذف أو إلغاء تفعيل المستخدمين' }
    ]
  },
  {
    id: 'sales',
    name: 'المبيعات',
    icon: ShoppingCart,
    color: 'text-green-600',
    permissions: [
      { name: 'sales.create', desc: 'إنشاء فواتير بيع جديدة' },
      { name: 'sales.read', desc: 'عرض المبيعات والفواتير' },
      { name: 'sales.update', desc: 'تعديل فواتير البيع' },
      { name: 'sales.delete', desc: 'حذف فواتير البيع' }
    ]
  },
  {
    id: 'inventory',
    name: 'المخزون',
    icon: Package,
    color: 'text-purple-600',
    permissions: [
      { name: 'inventory.create', desc: 'إضافة منتجات جديدة' },
      { name: 'inventory.read', desc: 'عرض المخزون والمنتجات' },
      { name: 'inventory.update', desc: 'تعديل بيانات المنتجات والكميات' },
      { name: 'inventory.delete', desc: 'حذف منتجات من المخزون' }
    ]
  },
  {
    id: 'purchases',
    name: 'المشتريات',
    icon: Truck,
    color: 'text-orange-600',
    permissions: [
      { name: 'purchases.create', desc: 'إنشاء فواتير شراء جديدة' },
      { name: 'purchases.read', desc: 'عرض المشتريات والفواتير' },
      { name: 'purchases.update', desc: 'تعديل فواتير الشراء' },
      { name: 'purchases.delete', desc: 'حذف فواتير الشراء' }
    ]
  },
  {
    id: 'cash',
    name: 'الخزينة',
    icon: CreditCard,
    color: 'text-yellow-600',
    permissions: [
      { name: 'cash.create', desc: 'إضافة معاملات مالية جديدة' },
      { name: 'cash.read', desc: 'عرض حركات الخزينة' },
      { name: 'cash.update', desc: 'تعديل المعاملات المالية' },
      { name: 'cash.delete', desc: 'حذف معاملات من الخزينة' }
    ]
  },
  {
    id: 'reports',
    name: 'التقارير',
    icon: BarChart3,
    color: 'text-indigo-600',
    permissions: [
      { name: 'reports.read', desc: 'عرض جميع التقارير' },
      { name: 'reports.export', desc: 'تصدير التقارير بصيغ مختلفة' }
    ]
  },
  {
    id: 'settings',
    name: 'الإعدادات',
    icon: Settings,
    color: 'text-gray-600',
    permissions: [
      { name: 'settings.read', desc: 'عرض إعدادات النظام' },
      { name: 'settings.update', desc: 'تعديل إعدادات النظام' }
    ]
  }
];

const ROLE_LEVELS = [
  {
    level: 1,
    name: 'مالك النظام',
    description: 'صلاحيات كاملة وغير محدودة',
    color: 'destructive',
    permissions: 'جميع الصلاحيات'
  },
  {
    level: 2,
    name: 'مدير النظام',
    description: 'صلاحيات إدارية شاملة',
    color: 'destructive',
    permissions: 'معظم الصلاحيات عدا إدارة المستخدمين المتقدمة'
  },
  {
    level: 3,
    name: 'مدير',
    description: 'صلاحيات تشغيلية متقدمة',
    color: 'default',
    permissions: 'العمليات التشغيلية الأساسية والتقارير'
  },
  {
    level: 4,
    name: 'موظف',
    description: 'صلاحيات عمل أساسية',
    color: 'secondary',
    permissions: 'المبيعات والاستعلام عن المخزون'
  },
  {
    level: 5,
    name: 'مستخدم',
    description: 'صلاحيات قراءة فقط',
    color: 'secondary',
    permissions: 'عرض الملخص والتقارير الأساسية'
  }
];

export function PermissionsGuide() {
  return (
    <div className="space-y-6">
      {/* نظرة عامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            دليل الصلاحيات والأدوار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            يتيح لك نظام الصلاحيات التحكم الدقيق في ما يمكن للمستخدمين فعله في النظام. 
            كل مستخدم يمكن أن يكون له دور أو أكثر، وكل دور يحتوي على مجموعة من الصلاحيات.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">الأدوار</h3>
              <p className="text-sm text-muted-foreground">
                مجموعات منطقية من الصلاحيات
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">المستخدمون</h3>
              <p className="text-sm text-muted-foreground">
                الأشخاص الذين يستخدمون النظام
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">الصلاحيات</h3>
              <p className="text-sm text-muted-foreground">
                الإجراءات المسموحة في النظام
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مستويات الأدوار */}
      <Card>
        <CardHeader>
          <CardTitle>مستويات الأدوار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ROLE_LEVELS.map((role) => (
              <div key={role.level} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={role.color as any} className="min-w-fit">
                    مستوى {role.level}
                  </Badge>
                  <div>
                    <h4 className="font-medium">{role.name}</h4>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  {role.permissions}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* فئات الصلاحيات */}
      <Card>
        <CardHeader>
          <CardTitle>فئات الصلاحيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERMISSION_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {category.permissions.map((permission) => (
                      <div key={permission.name} className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-1">
                            {permission.name}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {permission.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* كيفية إعطاء الصلاحيات */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية إعطاء الصلاحيات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">انتقل إلى صفحة المستخدمين</h4>
                <p className="text-sm text-muted-foreground">
                  من القائمة الجانبية، اختر "إدارة المستخدمين"
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">اختر المستخدم</h4>
                <p className="text-sm text-muted-foreground">
                  انقر على "إدارة الأدوار" للمستخدم المطلوب
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">أضف دور جديد</h4>
                <p className="text-sm text-muted-foreground">
                  اختر الدور المناسب من القائمة المنسدلة وانقر "إضافة"
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">راجع الصلاحيات</h4>
                <p className="text-sm text-muted-foreground">
                  تأكد من أن المستخدم لديه الصلاحيات المناسبة لعمله
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 نصائح مهمة
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• ابدأ بالأدوار ذات المستوى الأعلى (4-5) للموظفين الجدد</li>
              <li>• لا تعطي صلاحيات إدارية إلا للأشخاص الموثوقين</li>
              <li>• راجع صلاحيات المستخدمين بانتظام</li>
              <li>• يمكن للمستخدم أن يكون له أكثر من دور واحد</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}