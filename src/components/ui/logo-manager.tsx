import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Edit3, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthDialog } from "./auth-dialog";

interface LogoManagerProps {
  currentLogo?: string;
  onLogoChange: (logo: string) => void;
}

export function LogoManager({ currentLogo, onLogoChange }: LogoManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogo || "");
  const [logoText, setLogoText] = useState("عمران");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = localStorage.getItem("admin_authenticated");
    setIsAuthenticated(authStatus === "true");
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
        onLogoChange(result);
        toast({
          title: "تم التحديث",
          description: "تم تحديث الشعار بنجاح",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (logoUrl) {
      onLogoChange(logoUrl);
      toast({
        title: "تم التحديث", 
        description: "تم تحديث الشعار بنجاح",
      });
      setIsOpen(false);
    }
  };

  const handleTextUpdate = () => {
    onLogoChange(`text:${logoText}`);
    toast({
      title: "تم التحديث",
      description: "تم تحديث نص الشعار بنجاح",
    });
    setIsOpen(false);
  };

  const resetToDefault = () => {
    setLogoUrl("");
    setLogoText("عمران");
    onLogoChange("text:عمران");
    toast({
      title: "تم الإعادة",
      description: "تم إعادة تعيين الشعار للافتراضي",
    });
    setIsOpen(false);
  };

  const handleLogoClick = () => {
    // Logo is now fixed and non-editable
    return;
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setIsOpen(true);
  };

  return (
    <div>
      {!isAuthenticated ? (
        <Button
          onClick={() => setShowAuthDialog(true)}
          variant="ghost"
          size="sm"
          className="gap-2"
          title="تحديث الشعار"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      ) : (
        <>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Edit3 className="h-4 w-4" />
                تحديث الشعار
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إدارة الشعار</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>رفع شعار جديد</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      اختر ملف
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      PNG, JPG - حد أقصى 5MB
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <Label htmlFor="logo-url">رابط الشعار</Label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="mt-2"
                  />
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={!logoUrl.trim()}
                    className="mt-2 w-full"
                  >
                    استخدام الرابط
                  </Button>
                </div>

                <div>
                  <Label htmlFor="logo-text">نص الشعار</Label>
                  <Input
                    id="logo-text"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    placeholder="اسم الشركة"
                    className="mt-2"
                  />
                  <Button
                    onClick={handleTextUpdate}
                    disabled={!logoText.trim()}
                    className="mt-2 w-full"
                    variant="outline"
                  >
                    استخدام النص
                  </Button>
                </div>

                <Button
                  onClick={resetToDefault}
                  variant="destructive"
                  className="w-full"
                >
                  إعادة تعيين للافتراضي
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AuthDialog
            open={showAuthDialog}
            onOpenChange={(open) => setShowAuthDialog(open)}
            onAuthenticated={handleAuthenticated}
          />
        </>
      )}
    </div>
  );
}