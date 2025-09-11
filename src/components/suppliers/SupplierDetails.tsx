import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Star,
  AlertTriangle,
  Truck,
  Clock,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SupplierFinancialProfile } from './SupplierFinancialProfile';
import { SupplierAlerts } from './SupplierAlerts';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  center: string;
  country: string;
  category: string;
  rating: number;
  totalPurchases: number;
  status: 'active' | 'inactive' | 'pending';
  paymentTerms: string;
  notes?: string;
  joinDate: Date;
  riskLevel?: 'low' | 'medium' | 'high';
  totalDebt?: number;
  lastPurchaseDate?: string;
  creditLimit?: number;
  taxNumber?: string;
  onTimeDeliveryRate?: number;
  avgDeliveryDays?: number;
  qualityRating?: number;
}

interface SupplierDetailsProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (supplier: Supplier) => void;
}

export function SupplierDetails({ supplier, isOpen, onClose, onEdit }: SupplierDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && supplier) {
      setActiveTab('overview');
    }
  }, [isOpen, supplier]);

  if (!supplier) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary", 
      pending: "outline"
    };
    
    const labels = {
      active: "نشط",
      inactive: "غير نشط", 
      pending: "معلق"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const variants = {
      low: "default",
      medium: "outline",
      high: "destructive"
    };
    
    const labels = {
      low: "منخفض",
      medium: "متوسط", 
      high: "مرتفع"
    };

    return (
      <Badge variant={variants[riskLevel as keyof typeof variants] as any}>
        مخاطر {labels[riskLevel as keyof typeof labels]}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-500 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getPerformanceMetrics = () => {
    const metrics = [
      {
        label: 'إجمالي المشتريات',
        value: formatCurrency(supplier.totalPurchases),
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        label: 'التقييم العام',
        value: `${supplier.rating.toFixed(1)} / 5`,
        icon: Star,
        color: 'text-yellow-600'
      },
      {
        label: 'معدل التسليم في الوقت',
        value: `${(supplier.onTimeDeliveryRate || 0).toFixed(1)}%`,
        icon: Truck,
        color: 'text-blue-600'
      },
      {
        label: 'متوسط أيام التسليم',
        value: `${supplier.avgDeliveryDays || 0} يوم`,
        icon: Clock,
        color: 'text-purple-600'
      }
    ];

    return metrics;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {supplier.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{supplier.name}</div>
              <div className="text-sm text-muted-foreground">{supplier.category}</div>
            </div>
            <div className="flex gap-2 ml-auto">
              {getStatusBadge(supplier.status)}
              {getRiskBadge(supplier.riskLevel)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="font-cairo">نظرة عامة</TabsTrigger>
            <TabsTrigger value="financial" className="font-cairo">الملف المالي</TabsTrigger>
            <TabsTrigger value="performance" className="font-cairo">الأداء</TabsTrigger>
            <TabsTrigger value="alerts" className="font-cairo">التنبيهات</TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* معلومات الاتصال */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    معلومات الاتصال
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">الشخص المسؤول</div>
                      <div className="text-sm text-muted-foreground">{supplier.contactPerson}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">البريد الإلكتروني</div>
                      <div className="text-sm text-muted-foreground">{supplier.email || 'غير محدد'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">رقم الهاتف</div>
                      <div className="text-sm text-muted-foreground">{supplier.phone}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">العنوان</div>
                      <div className="text-sm text-muted-foreground">
                        {supplier.address && `${supplier.address}, `}
                        {supplier.city}, {supplier.country}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* تفاصيل الشركة */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    تفاصيل الشركة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">التصنيف</div>
                    <div>{supplier.category || 'غير محدد'}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">الرقم الضريبي</div>
                    <div>{supplier.taxNumber || 'غير محدد'}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">شروط الدفع</div>
                    <div>{supplier.paymentTerms || 'غير محدد'}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">تاريخ الانضمام</div>
                    <div>{new Date(supplier.joinDate).toLocaleDateString('ar-EG')}</div>
                  </div>

                  {supplier.lastPurchaseDate && (
                    <div>
                      <div className="font-medium text-sm text-muted-foreground">آخر عملية شراء</div>
                      <div>{new Date(supplier.lastPurchaseDate).toLocaleDateString('ar-EG')}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* مؤشرات الأداء */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مؤشرات الأداء الرئيسية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getPerformanceMetrics().map((metric, index) => (
                    <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
                      <metric.icon className={`h-8 w-8 mx-auto mb-2 ${metric.color}`} />
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <div className="text-sm text-muted-foreground">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* التقييم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  التقييم والجودة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">التقييم العام</span>
                      <span className="font-bold">{supplier.rating.toFixed(1)} / 5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getRatingStars(supplier.rating)}
                    </div>
                  </div>
                  
                  {supplier.qualityRating && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">جودة المنتجات</span>
                        <span className="font-bold">{supplier.qualityRating.toFixed(1)} / 5</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRatingStars(supplier.qualityRating)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* الملاحظات */}
            {supplier.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    ملاحظات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* الملف المالي */}
          <TabsContent value="financial">
            <SupplierFinancialProfile supplierId={supplier.id} />
          </TabsContent>

          {/* الأداء */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">الأداء المالي</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(supplier.totalPurchases)}
                  </div>
                  <div className="text-sm text-muted-foreground">إجمالي المشتريات</div>
                  {(supplier.totalDebt || 0) > 0 && (
                    <div className="text-sm text-red-600">
                      مديونية: {formatCurrency(supplier.totalDebt || 0)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">أداء التسليم</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {(supplier.onTimeDeliveryRate || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">التسليم في الوقت</div>
                  <div className="text-sm text-muted-foreground">
                    متوسط {supplier.avgDeliveryDays || 0} يوم
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">تقييم الجودة</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-3xl font-bold text-amber-600">
                    {(supplier.qualityRating || supplier.rating).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">من 5 نجوم</div>
                  <div className="flex justify-center">
                    {getRiskBadge(supplier.riskLevel)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* التنبيهات */}
          <TabsContent value="alerts">
            <SupplierAlerts supplierId={supplier.id} />
          </TabsContent>
        </Tabs>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(supplier)}>
              تعديل البيانات
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}