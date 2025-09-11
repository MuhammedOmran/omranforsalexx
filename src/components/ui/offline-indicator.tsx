import { useState, useEffect } from "react";
import { Wifi, WifiOff, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "عاد الاتصال بالإنترنت",
        description: "يمكنك الآن مزامنة بياناتك",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "تم فقدان الاتصال بالإنترنت",
        description: "التطبيق يعمل في الوضع الأوف لاين",
        variant: "destructive",
        duration: 5000,
      });
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  const handleInstallApp = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      console.log('Install prompt result:', result);
      setInstallPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const checkStorageHealth = () => {
    const health = storage.checkStorageHealth();
    
    if (health.isHealthy) {
      toast({
        title: "فحص التخزين",
        description: "نظام التخزين يعمل بشكل مثالي",
      });
    } else {
      toast({
        title: "تحذير من التخزين",
        description: health.errors.join(', '),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {/* Connection Status and Storage Check - في صف واحد */}
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
          isOnline 
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span className="font-tajawal">متصل</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span className="font-tajawal">أوف لاين</span>
            </>
          )}
        </div>

        {/* Storage Health Check Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={checkStorageHealth}
          className="text-xs px-2 py-1.5 h-auto font-tajawal"
        >
          <Check className="h-3 w-3 ml-1" />
          فحص التخزين
        </Button>
      </div>

      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4" />
            <span>تثبيت التطبيق</span>
          </div>
          <p className="text-xs mb-2">
            ثبت التطبيق للحصول على تجربة أفضل
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleInstallApp}
              className="text-xs"
            >
              تثبيت
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowInstallPrompt(false)}
              className="text-xs text-primary-foreground"
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}