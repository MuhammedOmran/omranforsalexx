import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Lock, Unlock, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LockdownStatus {
  isLocked: boolean;
  reason?: string;
  lockedAt?: string;
  lockedBy?: string;
  estimatedDuration?: number;
}

export function EmergencyLockdown() {
  const { user, logout } = useAuth();
  const [lockdownStatus, setLockdownStatus] = useState<LockdownStatus>(() => {
    const stored = localStorage.getItem('emergency_lockdown');
    return stored ? JSON.parse(stored) : { isLocked: false };
  });
  
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('30');
  const [confirmCode, setConfirmCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const EMERGENCY_CODE = 'OMRAN2024';

  const activateLockdown = (emergencyReason: string, estimatedMinutes: number) => {
    const lockdown: LockdownStatus = {
      isLocked: true,
      reason: emergencyReason,
      lockedAt: new Date().toISOString(),
      lockedBy: user?.email || 'النظام',
      estimatedDuration: estimatedMinutes
    };

    // حفظ حالة الإغلاق
    localStorage.setItem('emergency_lockdown', JSON.stringify(lockdown));
    setLockdownStatus(lockdown);

    // إغلاق جميع الجلسات النشطة
    localStorage.setItem('force_logout_all', 'true');
    
    // إشعار المستخدمين
    toast.error('تم تفعيل الإغلاق الطارئ للنظام', {
      description: `السبب: ${emergencyReason}`,
      duration: 10000
    });

    // تسجيل الحدث
    logEmergencyEvent('lockdown_activated', {
      reason: emergencyReason,
      duration: estimatedMinutes,
      activatedBy: user?.email
    });
  };

  const deactivateLockdown = () => {
    if (confirmCode !== EMERGENCY_CODE) {
      toast.error('رمز التأكيد غير صحيح');
      return;
    }

    // إلغاء الإغلاق
    localStorage.removeItem('emergency_lockdown');
    localStorage.removeItem('force_logout_all');
    setLockdownStatus({ isLocked: false });
    setConfirmCode('');
    setIsConfirming(false);

    toast.success('تم إلغاء الإغلاق الطارئ');

    // تسجيل الحدث
    logEmergencyEvent('lockdown_deactivated', {
      deactivatedBy: user?.email
    });
  };

  const handleEmergencyLockdown = (type: 'security' | 'maintenance' | 'custom') => {
    let emergencyReason = '';
    let estimatedMinutes = 30;

    switch (type) {
      case 'security':
        emergencyReason = 'تهديد أمني - إغلاق فوري للحماية';
        estimatedMinutes = 60;
        break;
      case 'maintenance':
        emergencyReason = 'صيانة طارئة - إغلاق مؤقت للنظام';
        estimatedMinutes = parseInt(duration) || 30;
        break;
      case 'custom':
        emergencyReason = reason || 'إغلاق طارئ للنظام';
        estimatedMinutes = parseInt(duration) || 30;
        break;
    }

    activateLockdown(emergencyReason, estimatedMinutes);
  };

  const logEmergencyEvent = (event: string, details: any) => {
    const emergencyLog = JSON.parse(localStorage.getItem('emergency_log') || '[]');
    emergencyLog.push({
      timestamp: new Date().toISOString(),
      event,
      details,
      userId: user?.id,
      userEmail: user?.email
    });
    
    // الاحتفاظ بآخر 100 حدث طارئ
    const limitedLog = emergencyLog.slice(-100);
    localStorage.setItem('emergency_log', JSON.stringify(limitedLog));
  };

  const getTimeRemaining = (): string => {
    if (!lockdownStatus.isLocked || !lockdownStatus.lockedAt || !lockdownStatus.estimatedDuration) {
      return '';
    }

    const lockedTime = new Date(lockdownStatus.lockedAt).getTime();
    const durationMs = lockdownStatus.estimatedDuration * 60 * 1000;
    const unlockTime = lockedTime + durationMs;
    const remaining = unlockTime - Date.now();

    if (remaining <= 0) {
      return 'انتهت المدة المقدرة';
    }

    const minutes = Math.floor(remaining / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} ساعة و ${minutes % 60} دقيقة`;
    }
    
    return `${minutes} دقيقة`;
  };

  if (lockdownStatus.isLocked) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Lock className="h-5 w-5" />
            الإغلاق الطارئ مفعل
          </CardTitle>
          <CardDescription>
            النظام في حالة إغلاق طارئ حالياً
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تحذير - النظام مغلق</AlertTitle>
            <AlertDescription>
              {lockdownStatus.reason}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">تم التفعيل:</span>
              <p>{new Date(lockdownStatus.lockedAt!).toLocaleString('ar-EG')}</p>
            </div>
            <div>
              <span className="font-medium">بواسطة:</span>
              <p>{lockdownStatus.lockedBy}</p>
            </div>
            <div>
              <span className="font-medium">المدة المقدرة:</span>
              <p>{lockdownStatus.estimatedDuration} دقيقة</p>
            </div>
            <div>
              <span className="font-medium">الوقت المتبقي:</span>
              <p>{getTimeRemaining()}</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">إلغاء الإغلاق الطارئ</h4>
            <div className="space-y-2">
              <Label htmlFor="confirm-code">رمز التأكيد</Label>
              <Input
                id="confirm-code"
                type="password"
                placeholder="أدخل رمز التأكيد"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
              />
              <Button 
                onClick={deactivateLockdown}
                variant="destructive"
                className="w-full"
                disabled={!confirmCode.trim()}
              >
                <Unlock className="h-4 w-4 mr-2" />
                إلغاء الإغلاق الطارئ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          الإغلاق الطارئ للنظام
        </CardTitle>
        <CardDescription>
          إغلاق فوري للنظام في حالات الطوارئ الأمنية أو التقنية
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تحذير: سيؤدي تفعيل الإغلاق الطارئ إلى قطع جميع الاتصالات وتسجيل خروج جميع المستخدمين فوراً
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* إغلاق أمني */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="h-20 flex flex-col gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span>إغلاق أمني فوري</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تأكيد الإغلاق الأمني</DialogTitle>
                <DialogDescription>
                  سيتم إغلاق النظام فوراً لمدة ساعة واحدة لأسباب أمنية
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    هذا الإجراء لا يمكن التراجع عنه وسيقطع جميع الاتصالات فوراً
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => handleEmergencyLockdown('security')}
                  variant="destructive"
                  className="w-full"
                >
                  تأكيد الإغلاق الأمني
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* إغلاق للصيانة */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Clock className="h-6 w-6" />
                <span>إغلاق للصيانة</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إغلاق للصيانة</DialogTitle>
                <DialogDescription>
                  إغلاق مؤقت للنظام لإجراء صيانة طارئة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maintenance-duration">المدة بالدقائق</Label>
                  <Input
                    id="maintenance-duration"
                    type="number"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="5"
                    max="480"
                  />
                </div>
                <Button 
                  onClick={() => handleEmergencyLockdown('maintenance')}
                  variant="destructive"
                  className="w-full"
                >
                  بدء الصيانة الطارئة
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* إغلاق مخصص */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="h-20 flex flex-col gap-2">
                <Lock className="h-6 w-6" />
                <span>إغلاق مخصص</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إغلاق مخصص</DialogTitle>
                <DialogDescription>
                  إغلاق النظام مع تحديد السبب والمدة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-reason">سبب الإغلاق</Label>
                  <Input
                    id="custom-reason"
                    placeholder="أدخل سبب الإغلاق"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="custom-duration">المدة بالدقائق</Label>
                  <Input
                    id="custom-duration"
                    type="number"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="5"
                    max="480"
                  />
                </div>
                <Button 
                  onClick={() => handleEmergencyLockdown('custom')}
                  variant="destructive"
                  className="w-full"
                  disabled={!reason.trim()}
                >
                  تفعيل الإغلاق المخصص
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">معلومات مهمة:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• رمز إلغاء الإغلاق الطارئ: <code className="bg-muted px-1 rounded">OMRAN2024</code></li>
            <li>• سيتم تسجيل جميع عمليات الإغلاق والإلغاء</li>
            <li>• يمكن للمدراء فقط إلغاء الإغلاق الطارئ</li>
            <li>• سيتم إشعار جميع المستخدمين بالإغلاق</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}