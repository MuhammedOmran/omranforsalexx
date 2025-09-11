import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { LicenseManager } from '@/utils/licenseManager';
import { toast } from 'sonner';
import { useAppSettings } from "@/hooks/useAppSettings";

export function LicenseActivation() {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getCategorySettings, setCategorySettings } = useAppSettings();

  const handleActivation = async () => {
    if (!licenseKey) {
      toast.error("يرجى إدخال مفتاح الترخيص");
      return;
    }

    setIsLoading(true);
    try {
      const result = await LicenseManager.activateLicense(licenseKey);

      if (result.success) {
        // حفظ الترخيص في Supabase
        const licenseData = {
          key: licenseKey,
          status: 'active',
          activatedAt: new Date().toISOString(),
          ...(result as any).license
        };
        
        await setCategorySettings('license', licenseData);
        
        toast.success("تم تفعيل الترخيص وحفظه في Supabase بنجاح!");
        setLicenseKey('');
      } else {
        toast.error(result.error || "حدث خطأ في التفعيل");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
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
              placeholder="أدخل مفتاح الترخيص"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleActivation}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري التفعيل...
              </>
            ) : (
              'تفعيل الترخيص'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* معلومات مهمة */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تأكد من إدخال مفتاح الترخيص الصحيح للحصول على جميع الميزات المتقدمة.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              في حالة وجود مشاكل في التفعيل، يرجى التواصل مع الدعم الفني.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}