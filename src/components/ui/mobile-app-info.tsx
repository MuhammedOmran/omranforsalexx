import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Smartphone, 
  Download, 
  Wifi, 
  WifiOff, 
  Database, 
  Shield, 
  Zap,
  Check,
  ArrowRight
} from "lucide-react";

export function MobileAppInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const features = [
    {
      icon: <WifiOff className="h-5 w-5 text-green-600" />,
      title: "عمل كامل أوف لاين",
      description: "يعمل التطبيق بشكل كامل بدون إنترنت مع حفظ جميع البيانات محلياً"
    },
    {
      icon: <Database className="h-5 w-5 text-blue-600" />,
      title: "تخزين محلي آمن",
      description: "جميع بياناتك محفوظة بأمان على جهازك مع نظام backup تلقائي"
    },
    {
      icon: <Shield className="h-5 w-5 text-purple-600" />,
      title: "أمان البيانات",
      description: "حماية كاملة للبيانات مع تشفير وعدم مشاركة مع خوادم خارجية"
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      title: "أداء سريع",
      description: "استجابة فورية وسرعة عالية في جميع العمليات"
    },
    {
      icon: <Smartphone className="h-5 w-5 text-indigo-600" />,
      title: "تطبيق موبايل أصلي",
      description: "يعمل كتطبيق حقيقي على الهاتف مع جميع المزايا الأصلية"
    }
  ];

  const installSteps = [
    {
      step: 1,
      title: "نقل المشروع إلى GitHub",
      description: "استخدم زر 'Export to Github' لنقل المشروع إلى مستودع GitHub الخاص بك"
    },
    {
      step: 2,
      title: "استنساخ المشروع",
      description: "قم بعمل git pull للمشروع من مستودع GitHub الخاص بك"
    },
    {
      step: 3,
      title: "تثبيت Dependencies",
      description: "تشغيل 'npm install' لتثبيت جميع الحزم المطلوبة"
    },
    {
      step: 4,
      title: "إضافة المنصة",
      description: "تشغيل 'npx cap add ios' أو 'npx cap add android' حسب المنصة المطلوبة"
    },
    {
      step: 5,
      title: "تحديث Dependencies",
      description: "تشغيل 'npx cap update ios' أو 'npx cap update android'"
    },
    {
      step: 6,
      title: "بناء المشروع",
      description: "تشغيل 'npm run build' لبناء التطبيق"
    },
    {
      step: 7,
      title: "مزامنة المشروع",
      description: "تشغيل 'npx cap sync' لمزامنة المشروع مع المنصة الأصلية"
    },
    {
      step: 8,
      title: "تشغيل التطبيق",
      description: "تشغيل 'npx cap run android' أو 'npx cap run ios' لتشغيل التطبيق"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Smartphone className="h-4 w-4" />
          معلومات التطبيق المحمول
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            تطبيق عمران للمبيعات - نسخة محمولة
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              جاهز للتطبيق المحمول
            </Badge>
            <Badge variant="secondary">
              Capacitor + PWA
            </Badge>
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>المزايا والخصائص</CardTitle>
              <CardDescription>
                التطبيق جاهز للعمل كتطبيق محمول مع جميع المزايا التالية:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    {feature.icon}
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Installation Steps */}
          <Card>
            <CardHeader>
              <CardTitle>خطوات تثبيت التطبيق المحمول</CardTitle>
              <CardDescription>
                اتبع هذه الخطوات لتحويل التطبيق إلى تطبيق محمول أصلي:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {installSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {index < installSteps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>المتطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">لتطبيق Android:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Android Studio</li>
                    <li>• Java Development Kit (JDK)</li>
                    <li>• Android SDK</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">لتطبيق iOS:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• macOS</li>
                    <li>• Xcode</li>
                    <li>• iOS Simulator</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">ملاحظات مهمة</CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-700 dark:text-yellow-300">
              <ul className="space-y-2 text-sm">
                <li>• التطبيق يعمل حالياً في المتصفح مع دعم كامل للوضع الأوف لاين</li>
                <li>• جميع البيانات محفوظة محلياً ولا تحتاج لخادم خارجي</li>
                <li>• يمكن تثبيت التطبيق كـ PWA مباشرة من المتصفح</li>
                <li>• للحصول على تطبيق محمول أصلي، اتبع الخطوات المذكورة أعلاه</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}