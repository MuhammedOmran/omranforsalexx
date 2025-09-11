import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Crown, 
  Star, 
  Check, 
  Zap,
  Building,
  Users,
  BarChart3,
  Shield,
  Headphones
} from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { toast } from '@/hooks/use-toast';

interface LicensePlan {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  duration: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  color: string;
  maxUsers: number;
  maxDevices: number;
}

const plans: LicensePlan[] = [
  {
    id: 'trial',
    name: 'Trial',
    nameAr: 'تجريبي',
    price: 0,
    duration: 5,
    maxUsers: 1,
    maxDevices: 1,
    features: [
      'إنشاء حتى 50 فاتورة',
      'إدارة العملاء الأساسية',
      'تقارير أساسية',
      'دعم عبر البريد الإلكتروني',
      'مستخدم واحد فقط',
      'جهاز واحد فقط'
    ],
    icon: <Star className="h-6 w-6" />,
    color: 'border-gray-200'
  },
  {
    id: 'basic',
    name: 'Basic',
    nameAr: 'أساسي',
    price: 150,
    duration: 30,
    maxUsers: 3,
    maxDevices: 5,
    features: [
      'فواتير غير محدودة',
      'إدارة متقدمة للعملاء',
      'تقارير مفصلة',
      'دعم فني',
      '3 مستخدمين',
      '5 أجهزة'
    ],
    icon: <Zap className="h-6 w-6" />,
    color: 'border-blue-200'
  },
  {
    id: 'standard',
    name: 'Standard',
    nameAr: 'معياري',
    price: 400,
    duration: 90,
    maxUsers: 5,
    maxDevices: 10,
    features: [
      'جميع ميزات الأساسي',
      'تقارير متقدمة',
      'نسخ احتياطي تلقائي',
      '5 مستخدمين',
      '10 أجهزة',
      'دعم فني مخصص'
    ],
    icon: <BarChart3 className="h-6 w-6" />,
    popular: true,
    color: 'border-primary'
  },
  {
    id: 'premium',
    name: 'Premium',
    nameAr: 'مميز',
    price: 1200,
    duration: 365,
    maxUsers: 10,
    maxDevices: 20,
    features: [
      'جميع ميزات المعياري',
      'تحديثات مجانية',
      'دعم فني 24/7',
      'تدريب مخصص',
      '10 مستخدمين',
      '20 جهاز'
    ],
    icon: <Crown className="h-6 w-6" />,
    color: 'border-purple-500'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    nameAr: 'مدى الحياة',
    price: 5000,
    duration: 365000,
    maxUsers: 999,
    maxDevices: 999,
    features: [
      'جميع الميزات',
      'مستخدمين غير محدودين',
      'أجهزة غير محدودة',
      'دعم مدى الحياة',
      'تحديثات مجانية مدى الحياة',
      'أولوية في الدعم'
    ],
    icon: <Building className="h-6 w-6" />,
    color: 'border-gradient-primary'
  }
];

export function LicenseUpgrade() {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { addLicense, refreshLicense } = useLicense();

  const handleUpgrade = async (plan: LicensePlan) => {
    setUpgrading(plan.id);
    
    try {
      if (plan.id === 'trial') {
        await addLicense(plan.duration, plan.id);
        toast({
          title: "تم تفعيل الخطة التجريبية",
          description: `تم تفعيل خطة ${plan.nameAr} لمدة ${plan.duration} يوم`,
        });
      } else if (plan.id === 'lifetime') {
        // ترخيص مدى الحياة - 1000 سنة
        await addLicense(365000, 'lifetime');
        toast({
          title: "تم تفعيل ترخيص مدى الحياة",
          description: "تم تفعيل ترخيص مدى الحياة (1000 سنة) بنجاح!",
        });
      } else {
        // محاكاة عملية الدفع
        await new Promise(resolve => setTimeout(resolve, 2000));
        await addLicense(plan.duration, plan.id);
        toast({
          title: "تم ترقية الخطة بنجاح",
          description: `تم ترقية حسابك إلى خطة ${plan.nameAr}`,
        });
      }
      
      await refreshLicense();
    } catch (error) {
      toast({
        title: "خطأ في الترقية",
        description: "فشل في ترقية الخطة. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            ترقية الخطة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            اختر الخطة المناسبة لاحتياجاتك واستمتع بميزات متقدمة أكثر
          </p>
        </CardContent>
      </Card>

      {/* الخطط المتاحة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-primary' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  الأكثر شعبية
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4 text-primary">
                {plan.icon}
              </div>
              <CardTitle className="text-2xl">{plan.nameAr}</CardTitle>
              <div className="space-y-2">
                <div className="text-3xl font-bold">
                  {plan.price === 0 ? 'مجاني' : `${plan.price} ج.م`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {plan.duration} يوم
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan)}
                disabled={upgrading !== null}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {upgrading === plan.id ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    جاري التفعيل...
                  </>
                ) : plan.id === 'trial' ? (
                  'تجربة مجانية'
                ) : (
                  'ترقية الآن'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ميزات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>لماذا الترقية؟</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <BarChart3 className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">تقارير متقدمة</h4>
              <p className="text-sm text-muted-foreground">
                احصل على تحليلات مفصلة لأعمالك
              </p>
            </div>

            <div className="text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">إدارة المستخدمين</h4>
              <p className="text-sm text-muted-foreground">
                أضف فريق عملك وحدد الصلاحيات
              </p>
            </div>

            <div className="text-center space-y-2">
              <Shield className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">نسخ احتياطي آمن</h4>
              <p className="text-sm text-muted-foreground">
                احم بياناتك بنسخ احتياطي تلقائي
              </p>
            </div>

            <div className="text-center space-y-2">
              <Headphones className="h-8 w-8 mx-auto text-primary" />
              <h4 className="font-medium">دعم مخصص</h4>
              <p className="text-sm text-muted-foreground">
                احصل على دعم فني سريع ومخصص
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}