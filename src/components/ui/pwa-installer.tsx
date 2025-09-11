import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // التحقق من وجود التطبيق مثبت مسبقاً
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // الاستماع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // عرض بطاقة التثبيت بعد تأخير قصير
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallCard(true);
        }
      }, 5000);
    };

    // الاستماع لحدث التثبيت
    const handleAppInstalled = () => {
      console.log('PWA تم تثبيت التطبيق');
      setIsInstalled(true);
      setShowInstallCard(false);
      setDeferredPrompt(null);
      
      toast({
        title: "تم التثبيت بنجاح!",
        description: "تم تثبيت تطبيق عمران للمبيعات على جهازك",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('المستخدم وافق على التثبيت');
        toast({
          title: "جاري التثبيت...",
          description: "يتم تثبيت التطبيق على جهازك",
        });
      } else {
        console.log('المستخدم رفض التثبيت');
      }
      
      setDeferredPrompt(null);
      setShowInstallCard(false);
    } catch (error) {
      console.error('خطأ في عملية التثبيت:', error);
      toast({
        title: "خطأ في التثبيت",
        description: "حدث خطأ أثناء محاولة تثبيت التطبيق",
        variant: "destructive"
      });
    }
  };

  const handleDismiss = () => {
    setShowInstallCard(false);
    
    // عدم إظهار البطاقة مرة أخرى في هذه الجلسة
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // عدم إظهار البطاقة إذا تم رفضها في هذه الجلسة
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setShowInstallCard(false);
    }
  }, []);

  // عدم إظهار أي شيء إذا كان التطبيق مثبت أو لا يوجد prompt
  if (isInstalled || !deferredPrompt || !showInstallCard) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 shadow-lg border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            ثبت التطبيق
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ثبت تطبيق عمران للمبيعات على جهازك للحصول على تجربة أفضل وإمكانية الوصول السريع
        </p>
        
        <div className="flex items-center gap-2 text-sm">
          <div className="flex -space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
          <span className="text-muted-foreground">يعمل بدون إنترنت</span>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleInstallClick} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            ثبت الآن
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            لاحقاً
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// مكون للتحقق من حالة PWA
export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // التحقق من التثبيت
    const checkInstallation = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      } else if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    };

    // مراقبة الاتصال
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    checkInstallation();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-muted-foreground">
          {isOnline ? 'متصل' : 'غير متصل'} • تطبيق مثبت
        </span>
      </div>
    );
  }

  return null;
}