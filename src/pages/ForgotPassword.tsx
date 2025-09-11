import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // التحقق من صحة البريد الإلكتروني
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "خطأ في البريد الإلكتروني",
          description: "يرجى إدخال بريد إلكتروني صحيح",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error('Reset password error:', error);
        toast({
          title: "خطأ في إرسال البريد",
          description: "تأكد من صحة البريد الإلكتروني والمحاولة مرة أخرى",
          variant: "destructive",
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: "تم إرسال البريد بنجاح",
        description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور",
      });

    } catch (error) {
      console.error('Password reset catch error:', error);
      toast({
        title: "حدث خطأ",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 left-4 z-10">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-arabic-elegant text-center text-primary">
                تم إرسال البريد
              </CardTitle>
              <CardDescription className="text-center mt-2 font-tajawal">
                تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground font-cairo">
                  تم إرسال رابط إعادة تعيين كلمة المرور إلى: <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-cairo">
                    إذا لم تجد البريد، تحقق من مجلد الرسائل غير المرغوب فيها (Spam)
                  </p>
                </div>

                <Button 
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  إرسال مرة أخرى
                </Button>

                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors font-cairo no-underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-arabic-elegant text-center text-primary">
              نسيت كلمة المرور؟
            </CardTitle>
            <CardDescription className="text-center mt-2 font-tajawal">
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Mail className="w-4 h-4" />
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="أدخل البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10"
                    autoComplete="email"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity duration-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الإرسال...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-cairo">
                    <Mail className="w-4 h-4" />
                    إرسال رابط إعادة التعيين
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center space-y-2 pt-4 border-t border-border/50">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors font-cairo no-underline"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Link>
              <p className="text-xs text-muted-foreground font-munada">
                © 2025 عمران للمبيعات - جميع الحقوق محفوظة
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}