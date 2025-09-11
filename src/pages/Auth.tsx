import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Users, Edit2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LocalAccountSwitcher } from '@/components/accounts/LocalAccountSwitcher';
import { supabase } from '@/integrations/supabase/client';

interface SavedAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  lastLogin: string;
}

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const { signIn, isAuthenticated, loading, user, profile, updateProfile } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  useEffect(() => {
    // تحميل الحسابات المحفوظة
    loadSavedAccounts();
  }, []);

  const loadSavedAccounts = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
      setSavedAccounts(accounts);
    } catch (error) {
      setSavedAccounts([]);
    }
  };

  const switchToAccount = (account: SavedAccount) => {
    setEmail(account.email);
    setShowAccountSwitcher(false);
    toast({
      title: "تم تحديد الحساب",
      description: `تم تحديد حساب ${account.name}، أدخل كلمة المرور للدخول`,
    });
  };

  const removeAccount = (accountId: string) => {
    const currentSavedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
    const filteredAccounts = currentSavedAccounts.filter((acc: SavedAccount) => acc.id !== accountId);
    localStorage.setItem("saved_accounts", JSON.stringify(filteredAccounts));
    loadSavedAccounts();
    toast({
      title: "تم حذف الحساب",
      description: "تم حذف الحساب من القائمة المحفوظة",
    });
  };

  const formatLastLogin = (date: string) => {
    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "منذ دقائق";
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    return `منذ ${Math.floor(diffInHours / 24)} يوم`;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // التحقق من حساب المطور
      const isDeveloper = email === "omrani@ahmed.dev" && password === "ahmed01122329724K";
      
      if (isDeveloper) {
        // تسجيل دخول المطور مع صلاحيات خاصة
        const result = await signIn(email, password);
        
        if (result.error) {
          setError('خطأ في تسجيل الدخول: ' + result.error.message);
        } else {
          // إعداد صلاحيات المطور
          localStorage.setItem('developer_mode', 'true');
          localStorage.setItem('license_status', JSON.stringify({
            isActivated: true,
            type: 'DEVELOPER',
            features: ['ALL_FEATURES'],
            companyInfo: {
              name: "المطور - عمران",
              email: "developer@omran.com"
            },
            activatedAt: new Date().toISOString(),
            expiresAt: '2099-12-31T23:59:59.999Z'
          }));
          
          // حفظ حساب المطور
          const currentSavedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
          const existingAccountIndex = currentSavedAccounts.findIndex((acc: SavedAccount) => acc.email === email);
          
          const developerAccountData: SavedAccount = {
            id: 'developer-account',
            email: email,
            name: 'المطور - عمران',
            avatar: '/lovable-uploads/c0a76972-ff67-4e02-90c7-ddc93a3c69d0.png',
            lastLogin: new Date().toISOString()
          };

          if (existingAccountIndex !== -1) {
            currentSavedAccounts[existingAccountIndex] = developerAccountData;
          } else {
            currentSavedAccounts.push(developerAccountData);
          }

          localStorage.setItem("saved_accounts", JSON.stringify(currentSavedAccounts));
          loadSavedAccounts();
          
          toast({
            title: "تم تسجيل الدخول كمطور",
            description: "مرحباً بك! لديك صلاحيات كاملة كمطور النظام",
          });
        }
        return;
      }

      // للمستخدمين العاديين - تسجيل دخول مباشر
      if (!email || !password) {
        setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
        return;
      }

      const result = await signIn(email, password);
      
      if (result.error) {
        if (result.error.message.includes('Invalid login credentials')) {
          setError('بيانات تسجيل الدخول غير صحيحة');
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('يرجى تأكيد البريد الإلكتروني أولاً');
        } else {
          setError('خطأ في تسجيل الدخول: ' + result.error.message);
        }
        return;
      }

      if (rememberMe) {
        localStorage.setItem("remember_login", "true");
      } else {
        localStorage.removeItem("remember_login");
      }

      // حفظ الحساب الحالي في قائمة الحسابات المحفوظة
      if (result.data?.user) {
        const currentSavedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
        const existingAccountIndex = currentSavedAccounts.findIndex((acc: SavedAccount) => acc.email === email);
        
        // تحديد اسم العرض المفضل
        let displayName =
          result.data.user.user_metadata?.full_name ||
          result.data.user.user_metadata?.name ||
          result.data.user.email?.split('@')[0] ||
          'مستخدم';

        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', result.data.user.id)
            .maybeSingle();

          if (profileData?.full_name) {
            displayName = profileData.full_name;
          } else if (profileData?.username) {
            displayName = profileData.username;
          }
        } catch {}
        
        const accountData: SavedAccount = {
          id: result.data.user.id,
          email: email,
          name: displayName,
          avatar: result.data.user.user_metadata?.avatar_url,
          lastLogin: new Date().toISOString()
        };

        if (existingAccountIndex !== -1) {
          currentSavedAccounts[existingAccountIndex] = accountData;
        } else {
          currentSavedAccounts.push(accountData);
        }

        localStorage.setItem("saved_accounts", JSON.stringify(currentSavedAccounts));
        loadSavedAccounts();
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام عُمران",
      });

    } catch (error) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) {
      setError('يرجى إدخال الاسم الجديد');
      return;
    }

    setIsUpdatingName(true);
    setError('');

    try {
      const result = await updateProfile({ full_name: newName.trim() });
      
      if (result.error) {
        setError('خطأ في تحديث الاسم: ' + result.error.message);
        return;
      }

      // تحديث الحسابات المحفوظة
      const currentSavedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
      const accountIndex = currentSavedAccounts.findIndex((acc: SavedAccount) => acc.id === user.id);
      
      if (accountIndex !== -1) {
        currentSavedAccounts[accountIndex].name = newName.trim();
        localStorage.setItem("saved_accounts", JSON.stringify(currentSavedAccounts));
        loadSavedAccounts();
      }

      setShowNameEditor(false);
      setNewName('');
      
      toast({
        title: "تم تحديث الاسم بنجاح",
        description: "تم حفظ الاسم الجديد في ملفك الشخصي",
      });

    } catch (error) {
      setError('حدث خطأ غير متوقع أثناء تحديث الاسم');
    } finally {
      setIsUpdatingName(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <img src="/lovable-uploads/c0a76972-ff67-4e02-90c7-ddc93a3c69d0.png" alt="SPADEX" className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-cairo">SPADEX</h1>
          <p className="text-muted-foreground font-tajawal">نظام إدارة شامل للأعمال</p>
        </div>

        <div className="w-full">
          {/* Account Switcher - يظهر دائماً */}
          <div className="mb-4">
            <LocalAccountSwitcher />
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="text-right">
              <CardTitle className="text-right font-cairo">
                تسجيل الدخول
              </CardTitle>
              <CardDescription className="text-right font-tajawal">
                أدخل بياناتك للوصول إلى حسابك
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-right block font-cairo">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="example@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 text-right"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-right block font-cairo">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10 text-right [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      style={{
                        backgroundImage: 'none',
                      }}
                      autoComplete="current-password"
                      required
                    />
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
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-start">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <span className="text-sm text-muted-foreground font-tajawal">تذكرني</span>
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
                
                {/* Name Editor Button - Only show if user is logged in */}
                {isAuthenticated && profile && (
                  <Dialog open={showNameEditor} onOpenChange={setShowNameEditor}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        تعديل الاسم
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-right">تعديل الاسم</DialogTitle>
                        <DialogDescription className="text-right">
                          قم بتحديث اسمك الذي يظهر في النظام
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-name" className="text-right block font-cairo">الاسم الجديد</Label>
                          <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-name"
                              type="text"
                              placeholder={profile?.full_name || "أدخل الاسم الجديد"}
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="pr-10 text-right"
                            />
                          </div>
                        </div>
                        
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowNameEditor(false);
                              setNewName('');
                              setError('');
                            }}
                            disabled={isUpdatingName}
                          >
                            إلغاء
                          </Button>
                          <Button 
                            onClick={handleUpdateName}
                            disabled={isUpdatingName || !newName.trim()}
                          >
                            {isUpdatingName ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                جاري التحديث...
                              </>
                            ) : (
                              'تحديث الاسم'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {/* Account Switcher Button */}
                {savedAccounts.length > 0 && (
                  <Dialog open={showAccountSwitcher} onOpenChange={setShowAccountSwitcher}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        تبديل الحساب ({savedAccounts.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-right">تبديل الحساب</DialogTitle>
                        <DialogDescription className="text-right">
                          اختر الحساب الذي تريد تسجيل الدخول إليه
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-3 mt-4">
                        {savedAccounts.map((account) => (
                          <div 
                            key={account.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                            onClick={() => switchToAccount(account)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={account.avatar} alt={account.name} />
                                <AvatarFallback>
                                  {account.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{account.name}</p>
                                <p className="text-xs text-muted-foreground">{account.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  آخر دخول: {formatLastLogin(account.lastLogin)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAccount(account.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              إزالة
                            </Button>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p className="font-tajawal">الحسابات لنشاطك التجارى صارت أسهل مع تطبيقنا</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;