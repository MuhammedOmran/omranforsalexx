import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Lock, ArrowLeft, Mail, Phone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LicenseManager } from "@/utils/licenseManager";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    licenseKey: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // التحقق من صحة البيانات
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "خطأ في كلمة المرور",
          description: "كلمة المرور وتأكيد كلمة المرور غير متطابقان",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "كلمة مرور ضعيفة",
          description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
          variant: "destructive",
        });
        return;
      }

      if (!formData.username.trim() || !formData.email.trim() || !formData.licenseKey.trim()) {
        toast({
          title: "بيانات ناقصة",
          description: "يرجى إدخال جميع البيانات المطلوبة بما في ذلك مفتاح الترخيص",
          variant: "destructive",
        });
        return;
      }

      // التحقق من صحة مفتاح الترخيص
      const licenseValidation = await LicenseManager.validateLicenseKey(formData.licenseKey);
      if (!licenseValidation.isValid) {
        toast({
          title: "مفتاح ترخيص غير صالح",
          description: licenseValidation.error || "مفتاح الترخيص المدخل غير صحيح",
          variant: "destructive",
        });
        return;
      }

      // تفعيل الترخيص أولاً
      const activationResult = await LicenseManager.activateLicense(formData.licenseKey, {
        name: formData.username.trim(),
        email: formData.email.trim()
      });

      if (!activationResult.success) {
        toast({
          title: "فشل في تفعيل الترخيص",
          description: activationResult.error || "حدث خطأ في تفعيل الترخيص",
          variant: "destructive",
        });
        return;
      }

      // استخدام دالة register من AuthContext
      const result = await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim()
      });

      if (result.success) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تم إرسال رابط التفعيل إلى بريدك الإلكتروني. يرجى التحقق من البريد وتفعيل الحساب",
        });
        // البقاء في نفس الصفحة لإظهار رسالة النجاح
        setFormData({
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          licenseKey: ""
        });
      } else {
        // في حالة فشل إنشاء الحساب، استخدم معالجة الأخطاء
        const errorMessage = result.error?.message || 'فشل في إنشاء الحساب';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      
      // التحقق من نوع الخطأ وإظهار رسالة مناسبة
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('password should be at least 6 characters') || 
            errorMessage.includes('weak_password') ||
            errorMessage.includes('length')) {
          toast({
            title: "كلمة مرور ضعيفة",
            description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
            variant: "destructive",
          });
        } else if (errorMessage.includes('user already registered') || 
                   errorMessage.includes('email address not available')) {
          toast({
            title: "البريد الإلكتروني مسجل مسبقاً",
            description: "هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول",
            variant: "destructive",
          });
        } else if (errorMessage.includes('invalid email') || 
                   errorMessage.includes('email_address_invalid') ||
                   errorMessage.includes('email address') && errorMessage.includes('invalid')) {
          toast({
            title: "بريد إلكتروني غير صحيح",
            description: "تأكد من كتابة البريد الإلكتروني بشكل صحيح (مثال: user@gmail.com)",
            variant: "destructive",
          });
        } else {
          toast({
            title: "فشل في إنشاء الحساب",
            description: "تأكد من صحة البيانات المدخلة وحاول مرة أخرى",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Register Card */}
        <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-arabic-elegant text-center text-primary">
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription className="text-center mt-2 font-tajawal">
              انضم إلى <span className="font-medium">عمران للمبيعات</span> وابدأ رحلتك التجارية
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <User className="w-4 h-4" />
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>

              {/* Email Field */}
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
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Phone className="w-4 h-4" />
                  رقم الهاتف (اختياري)
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="أدخل رقم الهاتف"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    dir="rtl"
                    className="pr-10"
                  />
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Lock className="w-4 h-4" />
                  كلمة المرور (6 أحرف على الأقل)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10 pl-10"
                    minLength={6}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  كلمة المرور يجب أن تحتوي على 6 أحرف أو أكثر
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Lock className="w-4 h-4" />
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="أعد إدخال كلمة المرور"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10 pl-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* License Key Field */}
              <div className="space-y-2">
                <Label htmlFor="licenseKey" className="text-sm font-medium flex items-center gap-2 font-cairo">
                  <Shield className="w-4 h-4" />
                  مفتاح الترخيص
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="licenseKey"
                    type="text"
                    placeholder="أدخل مفتاح الترخيص"
                    value={formData.licenseKey}
                    onChange={(e) => handleInputChange("licenseKey", e.target.value)}
                    required
                    dir="rtl"
                    className="pr-10"
                  />
                  <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  مثال: OMRAN-BASIC-XXXX أو OMRAN-PRO-XXXX
                </p>
              </div>

              {/* Register Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity duration-200 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-cairo">
                    إنشاء حساب
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center space-y-2 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground font-cairo">
                لديك حساب بالفعل؟{" "}
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary-hover font-medium transition-colors no-underline"
                >
                  تسجيل الدخول
                </Link>
              </p>
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