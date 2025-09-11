import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { toast } from '@/hooks/use-toast';

export function LicenseActivation() {
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const { addLicense, refreshLicense } = useLicense();

  const handleActivation = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال مفتاح الترخيص",
        variant: "destructive"
      });
      return;
    }

    setIsActivating(true);
    try {
      // محاكاة تفعيل الترخيص - سيتم استبدالها بـ API حقيقي
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // إضافة ترخيص تجريبي للاختبار
      await addLicense(365, 'premium');
      
      toast({
        title: "تم التفعيل بنجاح",
        description: "تم تفعيل الترخيص وإضافته إلى حسابك",
      });
      
      setLicenseKey('');
      await refreshLicense();
    } catch (error) {
      toast({
        title: "خطأ في التفعيل",
        description: "فشل في تفعيل الترخيص. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleTestLicense = async (licenseType: string, duration: number) => {
    setIsActivating(true);
    try {
      await addLicense(duration, licenseType);
      toast({
        title: `تم إضافة ترخيص ${getTypeName(licenseType)}`,
        description: `تم إضافة ترخيص ${getTypeName(licenseType)} لمدة ${duration} يوم`,
      });
      await refreshLicense();
    } catch (error) {
      toast({
        title: "خطأ في إضافة الترخيص",
        description: `فشل في إضافة الترخيص ${getTypeName(licenseType)}`,
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'trial': return 'التجريبي';
      case 'basic': return 'الأساسي';
      case 'quarterly': return 'الربع سنوي';
      case 'yearly': return 'السنوي';
      case 'monthly': return 'الشهري';
      case 'standard': return 'المعياري';
      case 'premium': return 'المميز';
      case 'lifetime': return 'مدى الحياة';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* تفعيل ترخيص جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            تفعيل ترخيص جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license-key">مفتاح الترخيص</Label>
            <Input
              id="license-key"
              placeholder="أدخل مفتاح الترخيص المكون من 25 حرف"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              maxLength={29} // 25 chars + 4 dashes
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              مثال: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleActivation}
              disabled={isActivating || !licenseKey.trim()}
              className="flex-1"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  تفعيل الترخيص
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* تراخيص تجريبية للاختبار */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            تراخيص تجريبية للاختبار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button 
              onClick={() => handleTestLicense('trial', 5)}
              disabled={isActivating}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="font-medium">تجريبي</span>
              <span className="text-xs text-muted-foreground">5 أيام - مستخدم واحد</span>
            </Button>
            
            <Button 
              onClick={() => handleTestLicense('basic', 30)}
              disabled={isActivating}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="font-medium">أساسي</span>
              <span className="text-xs text-muted-foreground">30 يوم - 3 مستخدمين</span>
            </Button>

            <Button 
              onClick={() => handleTestLicense('standard', 90)}
              disabled={isActivating}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="font-medium">معياري</span>
              <span className="text-xs text-muted-foreground">90 يوم - 5 مستخدمين</span>
            </Button>

            <Button 
              onClick={() => handleTestLicense('premium', 365)}
              disabled={isActivating}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="font-medium">مميز</span>
              <span className="text-xs text-muted-foreground">365 يوم - 5 مستخدمين</span>
            </Button>

            <Button 
              onClick={() => handleTestLicense('lifetime', 365000)}
              disabled={isActivating}
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 md:col-span-2 lg:col-span-1"
            >
              <span className="font-medium">مدى الحياة</span>
              <span className="text-xs text-muted-foreground">1000 سنة - لا محدود</span>
            </Button>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ملاحظة:</strong> هذه التراخيص للاختبار فقط. يمكنك تجربة جميع الأنواع لاختبار النظام.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* معلومات الترخيص */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ميزات الترخيص المدفوع:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>إمكانية إنشاء عدد لا محدود من الفواتير</li>
                <li>تقارير مفصلة ومتقدمة</li>
                <li>نسخ إحتياطي تلقائي</li>
                <li>دعم فني مخصص</li>
                <li>تحديثات مجانية لمدة سنة</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تنبيه:</strong> تأكد من إدخال مفتاح الترخيص الصحيح. 
              في حالة وجود مشاكل، تواصل مع الدعم الفني.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}