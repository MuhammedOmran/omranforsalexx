import { useDeviceAuth } from '@/hooks/useDeviceAuth';
import { Loader2, Shield, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DeviceAuthGuardProps {
  children: React.ReactNode;
}

export function DeviceAuthGuard({ children }: DeviceAuthGuardProps) {
  const { isAuthorized, loading, registerCurrentDevice, currentDeviceInfo } = useDeviceAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحقق من الجهاز...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Shield className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>جهاز غير مُفعل</CardTitle>
            <CardDescription>
              هذا الجهاز غير مُسجل للوصول إلى حسابك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {currentDeviceInfo.deviceName?.includes('هاتف') ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span className="font-medium">معلومات الجهاز</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>النوع:</strong> {currentDeviceInfo.deviceName}</p>
                <p><strong>المنصة:</strong> {currentDeviceInfo.platform}</p>
                <p><strong>المعرف:</strong> {currentDeviceInfo.deviceId.substring(0, 16)}...</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={registerCurrentDevice} 
                className="w-full"
              >
                تسجيل هذا الجهاز
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                سيتم تسجيل هذا الجهاز كجهاز مُفعل لحسابك
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}