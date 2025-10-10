import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { PermissionAction } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SecureOperationGuardProps {
  children: ReactNode;
  operation: string;
  module: string;
  action?: PermissionAction;
  requiresConfirmation?: boolean;
  requiresPassword?: boolean;
  requiresApproval?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  onExecute: () => void | Promise<void>;
  description?: string;
}

export function SecureOperationGuard({
  children,
  operation,
  module,
  action = 'update',
  requiresConfirmation = false,
  requiresPassword = false,
  requiresApproval = false,
  severity = 'medium',
  onExecute,
  description
}: SecureOperationGuardProps) {
  const { user, canAccess } = useAuth();
  const { logSensitiveAccess } = useSecurityAudit();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  
  const [isExecuting, setIsExecuting] = useState(false);

  // التحقق من الصلاحيات
  const hasPermission = canAccess(module, action);

  if (!hasPermission || !user) {
    return (
      <div className="relative group">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            غير مصرح
          </Badge>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    // تسجيل محاولة الوصول
    logSensitiveAccess(operation, 'view');

    if (requiresConfirmation || requiresPassword) {
      setIsDialogOpen(true);
    } else {
      executeOperation();
    }
  };

  const executeOperation = async () => {
    try {
      setIsExecuting(true);

      // Note: Password validation removed - implement server-side validation
      // using Supabase Auth or edge functions for production use
      if (requiresPassword && !password) {
        toast.error('كلمة المرور مطلوبة');
        return;
      }

      // تسجيل تنفيذ العملية
      logSensitiveAccess(operation, 'modify', null, { 
        timestamp: new Date().toISOString(),
        requiresApproval 
      });

      if (requiresApproval) {
        toast.warning('العملية تحتاج موافقة المدير', {
          description: 'سيتم إشعارك عند الموافقة على العملية'
        });
      } else {
        await onExecute();
        toast.success('تم تنفيذ العملية بنجاح');
      }

      setIsDialogOpen(false);
      setPassword('');
    } catch (error) {
      toast.error('حدث خطأ أثناء تنفيذ العملية');
      console.error('Operation execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high': return <Shield className="h-4 w-4 text-warning" />;
      default: return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div onClick={handleClick} className="cursor-pointer">
          {children}
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon()}
            تأكيد العملية الحساسة
          </DialogTitle>
          <DialogDescription>
            {description || `أنت على وشك تنفيذ عملية ${operation} في وحدة ${module}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* معلومات العملية */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">العملية:</span>
              <Badge variant={getSeverityColor()}>{operation}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">الوحدة:</span>
              <span>{module}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">مستوى الخطورة:</span>
              <Badge variant={getSeverityColor()}>{severity}</Badge>
            </div>
            {requiresApproval && (
              <div className="flex items-center justify-between">
                <span className="font-medium">تحتاج موافقة:</span>
                <Badge variant="outline">نعم</Badge>
              </div>
            )}
          </div>

          {/* تحذيرات أمنية */}
          {severity === 'critical' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                هذه عملية حرجة قد تؤثر على النظام بشكل كبير. تأكد من صحة البيانات قبل المتابعة.
              </AlertDescription>
            </Alert>
          )}

          {requiresApproval && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                هذه العملية تحتاج موافقة من المدير. سيتم وضعها في قائمة الانتظار.
              </AlertDescription>
            </Alert>
          )}

          {/* إدخال كلمة المرور */}
          {requiresPassword && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                أدخل كلمة المرور لتأكيد العملية:
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                dir="ltr"
              />
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExecuting}
            >
              إلغاء
            </Button>
            <Button
              onClick={executeOperation}
              disabled={isExecuting || (requiresPassword && !password)}
              variant={severity === 'critical' ? 'destructive' : 'default'}
            >
              {isExecuting ? 'جاري التنفيذ...' : 'تأكيد التنفيذ'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}