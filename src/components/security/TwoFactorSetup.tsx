import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Shield, Copy, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSecureTwoFactor } from '@/hooks/useSecureTwoFactor';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const { 
    isEnabled,
    loading,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    regenerateBackupCodes
  } = useSecureTwoFactor();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string; backupCodes: string[] } | null>(null);

  const handleSetup = async () => {
    const data = await setupTwoFactor();
    if (data) {
      setSetupData(data);
      setStep('verify');
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim() || !setupData) {
      toast.error('يرجى إدخال رمز التحقق');
      return;
    }

    const success = await enableTwoFactor(setupData.secret, verificationCode, setupData.backupCodes);
    if (success) {
      setBackupCodes(setupData.backupCodes);
      setStep('backup');
    }
  };

  const handleComplete = () => {
    setStep('complete');
    setTimeout(() => {
      onOpenChange(false);
      resetState();
    }, 2000);
  };

  const handleDisable = async () => {
    const success = await disableTwoFactor();
    if (success) {
      onOpenChange(false);
      resetState();
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const newCodes = await regenerateBackupCodes();
    if (newCodes) {
      setBackupCodes(newCodes);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ إلى الحافظة');
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.map((code, index) => 
      `${index + 1}. ${code}`
    ).join('\n');
    
    const blob = new Blob([
      `رموز الاحتياط - المصادقة الثنائية\n\n${codesText}\n\nملاحظة: احفظ هذه الرموز في مكان آمن. كل رمز يمكن استخدامه مرة واحدة فقط.`
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setStep('setup');
    setVerificationCode('');
    setBackupCodes([]);
    setSetupData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            المصادقة الثنائية
          </DialogTitle>
          <DialogDescription>
            {isEnabled ? 
              'إدارة إعدادات المصادقة الثنائية' : 
              'إعداد المصادقة الثنائية لحماية إضافية'
            }
          </DialogDescription>
        </DialogHeader>

        {isEnabled ? (
          <ManageSection 
            onDisable={handleDisable}
            onRegenerateBackupCodes={handleRegenerateBackupCodes}
            loading={loading}
          />
        ) : (
          <SetupSection
            step={step}
            setup={setupData}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            backupCodes={backupCodes}
            loading={loading}
            onSetup={handleSetup}
            onVerify={handleVerify}
            onComplete={handleComplete}
            onCopyToClipboard={copyToClipboard}
            onDownloadBackupCodes={downloadBackupCodes}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManageSection({ 
  onDisable, 
  onRegenerateBackupCodes, 
  loading 
}: {
  onDisable: () => void;
  onRegenerateBackupCodes: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          المصادقة الثنائية مفعلة ومحمية لحسابك
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Button 
          variant="outline" 
          onClick={onRegenerateBackupCodes}
          disabled={loading}
          className="w-full"
        >
          إنشاء رموز احتياطية جديدة
        </Button>

        <Button 
          variant="destructive" 
          onClick={onDisable}
          disabled={loading}
          className="w-full"
        >
          إلغاء تفعيل المصادقة الثنائية
        </Button>
      </div>
    </div>
  );
}

function SetupSection({
  step,
  setup,
  verificationCode,
  setVerificationCode,
  backupCodes,
  loading,
  onSetup,
  onVerify,
  onComplete,
  onCopyToClipboard,
  onDownloadBackupCodes
}: any) {
  return (
    <Tabs value={step} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="setup" disabled={step !== 'setup'}>إعداد</TabsTrigger>
        <TabsTrigger value="verify" disabled={step !== 'verify'}>تحقق</TabsTrigger>
        <TabsTrigger value="backup" disabled={step !== 'backup'}>احتياط</TabsTrigger>
        <TabsTrigger value="complete" disabled={step !== 'complete'}>مكتمل</TabsTrigger>
      </TabsList>

      <TabsContent value="setup" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الخطوة 1: إعداد التطبيق</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              قم بتحميل تطبيق المصادقة مثل Google Authenticator أو Microsoft Authenticator على هاتفك المحمول.
            </p>
            
            <Button onClick={onSetup} disabled={loading} className="w-full">
              {loading ? 'جاري الإعداد...' : 'بدء الإعداد'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="verify" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الخطوة 2: مسح رمز QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {setup && (
              <>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <img 
                      src={setup.qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    امسح رمز QR باستخدام تطبيق المصادقة، أو أدخل الرمز السري يدوياً:
                    <div className="mt-2 flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {setup.secret}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onCopyToClipboard(setup.secret)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">رمز التحقق</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="أدخل الرمز من التطبيق"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={onVerify} 
                  disabled={loading || !verificationCode.trim()}
                  className="w-full"
                >
                  {loading ? 'جاري التحقق...' : 'تحقق وتفعيل'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="backup" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الخطوة 3: رموز الاحتياط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                احفظ هذه الرموز في مكان آمن. يمكن استخدام كل رمز مرة واحدة فقط في حالة فقدان الوصول لتطبيق المصادقة.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="text-sm">{code}</code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onCopyToClipboard(code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onDownloadBackupCodes} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                تحميل
              </Button>
              <Button onClick={onComplete} className="flex-1">
                مكتمل
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="complete" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              تم التفعيل بنجاح!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              تم تفعيل المصادقة الثنائية بنجاح. حسابك الآن محمي بطبقة أمان إضافية.
            </p>
            
            <Badge variant="outline" className="mt-4 text-green-600 border-green-600">
              <Shield className="h-3 w-3 mr-1" />
              محمي بالمصادقة الثنائية
            </Badge>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}