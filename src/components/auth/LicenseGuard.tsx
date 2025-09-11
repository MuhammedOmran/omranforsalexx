import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Settings
} from 'lucide-react';
import { LicenseManager } from '@/utils/licenseManager';
import { LicenseActivation } from '@/components/ui/license-activation';

interface LicenseGuardProps {
  children: React.ReactNode;
  requiredFeature?: string;
}

export function LicenseGuard({ children, requiredFeature }: LicenseGuardProps) {
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [showActivation, setShowActivation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    setIsLoading(true);
    try {
      const result = await LicenseManager.validateLicense();
      setLicenseStatus(result);
      
      // إذا كان الترخيص غير صالح، عرض شاشة التفعيل
      if (!result.isValid) {
        setShowActivation(true);
      }
    } catch (error) {
      logger.error('خطأ في التحقق من الترخيص:', error);
      setShowActivation(true);
    } finally {
      setIsLoading(false);
    }
  };

  // إذا كان يتم التحقق من الترخيص
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>جاري التحقق من الترخيص...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إذا كان الترخيص غير صالح أو انتهت صلاحيته
  if (!licenseStatus?.isValid) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">عمران للمبيعات</h1>
            <p className="text-muted-foreground">نظام إدارة المبيعات والمحاسبة</p>
          </div>

          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {licenseStatus?.error || 'يتطلب ترخيص صالح لاستخدام التطبيق'}
            </AlertDescription>
          </Alert>

          <LicenseActivation />

          <div className="text-center">
            <Button variant="outline" onClick={checkLicense}>
              <Shield className="h-4 w-4 mr-2" />
              إعادة التحقق من الترخيص
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // التحقق من الميزة المطلوبة
  if (requiredFeature && !LicenseManager.hasFeature(requiredFeature)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            هذه الميزة غير متاحة في خطة الترخيص الحالية. يرجى الترقية للحصول على هذه الميزة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // عرض تنبيه إذا كان الترخيص سينتهي قريباً
  const daysRemaining = licenseStatus.daysRemaining;
  const showWarning = daysRemaining && daysRemaining <= 30;

  return (
    <div>
      {showWarning && (
        <Alert variant="destructive" className="mb-4">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            تنبيه: سينتهي الترخيص خلال {daysRemaining} يوم. يرجى تجديد الترخيص لتجنب انقطاع الخدمة.
          </AlertDescription>
        </Alert>
      )}
      
      {children}
    </div>
  );
}

// مكون لعرض حالة الترخيص في الواجهة
export function LicenseStatus() {
  const [license, setLicense] = useState<any>(null);

  useEffect(() => {
    const currentLicense = LicenseManager.getCurrentLicense();
    setLicense(currentLicense);
  }, []);

  if (!license) return null;

  const getLicenseColor = (type: string) => {
    const colors = {
      trial: 'bg-yellow-100 text-yellow-800',
      basic: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-orange-100 text-orange-800',
      professional: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || colors.basic;
  };

  return (
    <Badge className={getLicenseColor(license.type)}>
      <Shield className="h-3 w-3 mr-1" />
      {license.type === 'trial' ? 'تجريبي' : 
       license.type === 'basic' ? 'أساسي' :
       license.type === 'quarterly' ? 'ربع سنوي' :
       license.type === 'professional' ? 'احترافي' : 'المؤسسات'}
    </Badge>
  );
}