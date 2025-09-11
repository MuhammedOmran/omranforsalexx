import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const { toast } = useToast();

  const handleWhatsAppClick = () => {
    try {
      // رقم الواتساب مع كود الدولة الصحيح
      const whatsappNumber = "201090695336"; // كود مصر +20 مع الرقم
      const message = encodeURIComponent("مرحباً، أحتاج مساعدة في الحصول على مفتاح تفعيل نظام عمران للمبيعات");
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
      
      window.open(whatsappURL, '_blank');
      
      toast({
        title: "تم فتح واتساب",
        description: "سيتم توجيهك لمحادثة الدعم الفني",
      });
    } catch (error) {
      console.error('خطأ في فتح واتساب:', error);
      
      // نسخ الرقم للحافظة كخيار بديل
      navigator.clipboard.writeText("01090695336").then(() => {
        toast({
          title: "تم نسخ رقم الواتساب",
          description: "01090695336 - يمكنك التواصل مباشرة",
        });
      });
    }
  };

  const handleEmailClick = () => {
    try {
      const email = "xoxobnj@gmail.com";
      const subject = encodeURIComponent("طلب مفتاح تفعيل نظام عمران للمبيعات");
      const body = encodeURIComponent(`مرحباً،

أحتاج للحصول على مفتاح تفعيل لنظام عمران للمبيعات.

معلومات الشركة:
- اسم الشركة: 
- نوع النشاط: 
- عدد المستخدمين المتوقع: 

شكراً لكم`);
      
      const mailtoURL = `mailto:${email}?subject=${subject}&body=${body}`;
      window.open(mailtoURL, '_blank');
      
      toast({
        title: "تم فتح برنامج الإيميل",
        description: "سيتم توجيهك لإرسال رسالة للدعم الفني",
      });
    } catch (error) {
      console.error('خطأ في فتح الإيميل:', error);
      
      // نسخ الإيميل للحافظة كخيار بديل
      navigator.clipboard.writeText("xoxobnj@gmail.com").then(() => {
        toast({
          title: "تم نسخ عنوان الإيميل",
          description: "xoxobnj@gmail.com - يمكنك إرسال رسالة مباشرة",
        });
      });
    }
  };

  const handlePhoneClick = () => {
    try {
      const phoneNumber = "tel:01090695336";
      window.open(phoneNumber, '_self');
      
      toast({
        title: "جاري الاتصال",
        description: "01090695336",
      });
    } catch (error) {
      console.error('خطأ في الاتصال:', error);
      
      // نسخ الرقم للحافظة
      navigator.clipboard.writeText("01090695336").then(() => {
        toast({
          title: "تم نسخ رقم الهاتف",
          description: "01090695336 - يمكنك الاتصال مباشرة",
        });
      });
    }
  };

  const supportOptions = [
    {
      icon: Phone,
      title: "اتصال هاتفي",
      description: "تحدث مع فريق الدعم مباشرة",
      phoneNumber: "01090695336",
      action: handlePhoneClick,
      titleClass: "font-cairo",
      descriptionClass: "font-tajawal"
    },
    {
      icon: MessageCircle,
      title: "دعم فوري عبر واتساب",
      description: "احصل على مساعدة فورية ومفتاح التفعيل",
      action: handleWhatsAppClick,
      titleClass: "font-cairo",
      descriptionClass: "font-tajawal"
    },
    {
      icon: Mail,
      title: "إرسال إيميل",
      description: "راسل فريق الدعم الفني للحصول على مفتاح التفعيل",
      email: "xoxobnj@gmail.com",
      action: handleEmailClick,
      titleClass: "font-cairo",
      descriptionClass: "font-tajawal"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center font-arabic-elegant text-xl">
            الدعم الفني
          </DialogTitle>
          <DialogDescription className="text-center font-tajawal">
            اختر الطريقة المناسبة للحصول على مفتاح التفعيل والدعم الفني
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] overflow-auto">
          <div className="grid gap-4 py-4 px-1">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2 justify-end">
                <span className="font-medium text-blue-800 dark:text-blue-200 font-cairo">معلومات مهمة</span>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-tajawal text-right">
                عند التواصل مع الدعم الفني، يرجى ذكر:
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1 font-tajawal text-right list-none">
                <li className="text-right">• اسم الشركة أو المؤسسة</li>
                <li className="text-right">• نوع النشاط التجاري</li>
                <li className="text-right">• عدد المستخدمين المتوقع</li>
              </ul>
            </div>
            
            <div className="grid gap-3">
              {supportOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex items-start gap-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={option.action}
                  >
                    <IconComponent className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-right flex-1">
                      <div className={`font-medium text-foreground ${option.titleClass}`}>
                        {option.title}
                      </div>
                      <div className={`text-sm text-muted-foreground mt-1 ${option.descriptionClass}`}>
                        {option.description}
                      </div>
                      {option.phoneNumber && (
                        <div className="text-xs text-primary mt-1 font-mono direction-ltr">
                          {option.phoneNumber}
                        </div>
                      )}
                      {option.email && (
                        <div className="text-xs text-primary mt-1 font-mono direction-ltr">
                          {option.email}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Button>
                );
              })}
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-tajawal">
                  ساعات العمل: من السبت للخميس، 9 صباحاً - 6 مساءً
                </p>
                <p className="text-xs text-muted-foreground font-tajawal mt-1">
                  نسعد بخدمتكم ومساعدتكم في أي وقت
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}