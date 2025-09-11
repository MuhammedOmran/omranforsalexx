import { useState, useEffect } from 'react';
import { useDeviceAuth } from '@/hooks/useDeviceAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Monitor, Smartphone, Trash2, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function DeviceManagement() {
  const { userDevices, loadUserDevices, removeDevice, currentDeviceInfo } = useDeviceAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserDevices();
  }, []);

  const handleRemoveDevice = async (deviceId: string) => {
    setLoading(true);
    await removeDevice(deviceId);
    setLoading(false);
  };

  const formatLastLogin = (lastLogin: string) => {
    try {
      return formatDistanceToNow(new Date(lastLogin), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch {
      return 'غير محدد';
    }
  };

  const isCurrentDevice = (deviceId: string) => {
    return deviceId === currentDeviceInfo.deviceId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          إدارة الأجهزة المُفعلة
        </CardTitle>
        <CardDescription>
          يمكنك إدارة الأجهزة التي لها حق الوصول لحسابك
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {userDevices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد أجهزة مُسجلة</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {userDevices.map((device) => (
              <div
                key={device.id}
                className={`border rounded-lg p-4 ${
                  isCurrentDevice(device.device_id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {device.device_name?.includes('هاتف') ? (
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{device.device_name || 'جهاز غير معروف'}</h4>
                        {isCurrentDevice(device.device_id) && (
                          <Badge variant="default" className="text-xs">
                            الجهاز الحالي
                          </Badge>
                        )}
                        {device.is_active ? (
                          <Badge variant="secondary" className="text-xs">
                            مُفعل
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            معطل
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>آخر نشاط: {formatLastLogin(device.last_activity)}</span>
                        </div>
                        <p>المتصفح: {device.user_agent?.split(' ')[0] || 'غير معروف'}</p>
                        <p className="font-mono text-xs">
                          المعرف: {device.device_id.substring(0, 20)}...
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {device.is_active && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={loading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>إلغاء تفعيل الجهاز</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من إلغاء تفعيل هذا الجهاز؟ 
                            {isCurrentDevice(device.device_id) && (
                              <strong className="block mt-2 text-destructive">
                                تحذير: هذا هو الجهاز الحالي، سيتم تسجيل خروجك تلقائياً.
                              </strong>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveDevice(device.device_id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            إلغاء التفعيل
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-4 border-t">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">معلومات الجهاز الحالي</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>النوع:</strong> {currentDeviceInfo.deviceName}</p>
              <p><strong>المنصة:</strong> {currentDeviceInfo.platform}</p>
              <p><strong>المعرف:</strong> {currentDeviceInfo.deviceId.substring(0, 30)}...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}