import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Shield, Moon, Sun, Info, HelpCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BackupManager } from "@/utils/backupManager";

interface UserProfileProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function UserProfile({ darkMode, onToggleDarkMode }: UserProfileProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  
  const { user, profile, signOut } = useSupabaseAuth();
  const { toast } = useToast();

  // استخدام البيانات الفعلية من Supabase
  const displayName = profile?.full_name || profile?.username || user?.email || 'مستخدم';
  const userEmail = user?.email || '';
  const userRole = 'مالك البرنامج';

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "خطأ في تسجيل الخروج",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Close the popover first
      setIsOpen(false);
      
      // Navigate to auth page
      setTimeout(() => {
        navigate("/auth");
      }, 500);
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = () => {
    // لا نحتاج هذه الدالة الآن لأن التحديث يتم عبر SupabaseAuthContext
    setShowProfileDialog(false);
    toast({
      title: "معلومة",
      description: "يمكن تحديث البيانات الشخصية من صفحة الإعدادات",
    });
  };


  return (
    <>
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">الملف الشخصي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-cairo">الاسم</Label>
              <Input
                id="name"
                value={displayName}
                readOnly
                className="bg-muted/50 cursor-not-allowed font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-cairo">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                readOnly
                className="bg-muted/50 cursor-not-allowed font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="font-cairo">الدور</Label>
              <Input
                id="role"
                value={userRole}
                readOnly
                className="bg-muted/50 cursor-not-allowed font-tajawal"
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowProfileDialog(false)} className="w-full font-cairo">
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-gent-bold text-center">التواصل مع صاحب البرنامج للتفعيل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              قم بالتواصل مباشرة مع هذا الهاتف لأى استفسار أو لتفعيل البرنامج
            </p>
            
            {/* Display Phone Number */}
            <div className="space-y-2">
              <Label>رقم التواصل المباشر</Label>
              <Input
                type="tel"
                value="01090695336"
                readOnly
                className="bg-muted/50 cursor-not-allowed text-center font-medium"
              />
            </div>
            
            {/* WhatsApp Contact Section */}
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">أو تواصل مباشرة عبر:</p>
              <Button
                variant="outline"
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                onClick={() => {
                  window.open("https://wa.me/2001090695336?text=مرحبا، أريد تفعيل البرنامج", "_blank");
                }}
              >
                <Phone className="h-4 w-4 ml-2" />
                التواصل عبر الواتساب
              </Button>
            </div>
            
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowContactDialog(false)}
                className="w-full"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>المساعدة والدعم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">الأسئلة الشائعة</h4>
                <p className="text-xs text-muted-foreground">
                  كيفية استخدام النظام وحل المشاكل الشائعة
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">دليل المستخدم</h4>
                <p className="text-xs text-muted-foreground">
                  شرح مفصل لجميع ميزات البرنامج
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">التواصل مع الدعم</h4>
                <p className="text-xs text-muted-foreground">
                  للحصول على مساعدة فورية من فريق الدعم
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowHelpDialog(false)} 
              className="w-full"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حول البرنامج</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center">
                <Info className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold font-camel-thin">عمران للمبيعات</h3>
                <p className="text-sm text-muted-foreground font-camel-thin">الإصدار 1.0.0</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-camel-thin">
                نظام إدارة شامل للمبيعات والمخزون والعملاء
              </p>
              <p className="text-xs text-muted-foreground font-camel-thin">
                تم التطوير بواسطة Mohamed Ali Omran
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium font-camel-thin">معلومات إضافية:</p>
              <p className="text-xs text-muted-foreground font-camel-thin">
                • دعم العملة المحلية والأجنبية<br/>
                • تقارير مفصلة ومرنة<br/>
                • نظام أمان متقدم<br/>
                • واجهة سهلة الاستخدام
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowAboutDialog(false)} 
              className="w-full"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <User className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end" sideOffset={5}>
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-4 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm font-arabic-elegant">{displayName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowProfileDialog(true);
                setIsOpen(false);
              }}
            >
              <User className="h-4 w-4 ml-3" />
              الملف الشخصي
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={onToggleDarkMode}
            >
              {darkMode ? <Sun className="h-4 w-4 ml-3" /> : <Moon className="h-4 w-4 ml-3" />}
              {darkMode ? "الوضع الفاتح" : "الوضع المظلم"}
            </Button>


            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowAboutDialog(true);
                setIsOpen(false);
              }}
            >
              <Info className="h-4 w-4 ml-3" />
              حول البرنامج
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm font-cairo"
              onClick={() => {
                setShowContactDialog(true);
                setIsOpen(false);
              }}
            >
              <Phone className="h-4 w-4 ml-3" />
              لتفعيل البرنامج
            </Button>

            <Separator className="my-2" />

            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 ml-3" />
              تسجيل الخروج
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}