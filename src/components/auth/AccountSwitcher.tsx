import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Plus, 
  LogOut, 
  Settings, 
  UserPlus,
  Smartphone,
  Monitor,
  Trash2,
  Shield,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface SavedAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  lastLogin: string;
  role: string;
  isActive: boolean;
}

export function AccountSwitcher() {
  const { user, logout } = useAuth();
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New account form state
  const [newAccount, setNewAccount] = useState({
    email: "",
    password: "",
    name: ""
  });

  useEffect(() => {
    loadSavedAccounts();
  }, []); // removed dependency array that was causing infinite loop

  const loadSavedAccounts = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
      setSavedAccounts(accounts);
    } catch (error) {
      logger.error('خطأ في تحميل الحسابات المحفوظة', error, 'AccountSwitcher');
      setSavedAccounts([]);
    }
  };

  const saveCurrentAccount = () => {
    if (!user) return;
    
    const currentSavedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
    const existingAccountIndex = currentSavedAccounts.findIndex((acc: SavedAccount) => acc.email === user.email);
    
    const accountData: SavedAccount = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      lastLogin: new Date().toISOString(),
      role: user.role.nameAr,
      isActive: true
    };

    if (existingAccountIndex !== -1) {
      currentSavedAccounts[existingAccountIndex] = accountData;
    } else {
      currentSavedAccounts.push(accountData);
    }

    localStorage.setItem("saved_accounts", JSON.stringify(currentSavedAccounts));
    loadSavedAccounts();
    toast.success("تم حفظ الحساب");
  };

  const switchToAccount = async (account: SavedAccount) => {
    setIsLoading(true);
    
    try {
      // تسجيل الخروج من الحساب الحالي
      await logout();
      
      // محاولة تسجيل الدخول بالحساب المحفوظ
      // ملاحظة: هذا يتطلب كلمة المرور، لذا سنوجه المستخدم لصفحة تسجيل الدخول
      window.location.href = `/login?email=${encodeURIComponent(account.email)}`;
      
    } catch (error) {
      logger.error('خطأ في تبديل الحساب', error, 'AccountSwitcher');
      toast.error("فشل في تبديل الحساب");
    } finally {
      setIsLoading(false);
    }
  };

  const removeAccount = (accountId: string) => {
    const currentSavedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
    const filteredAccounts = currentSavedAccounts.filter((acc: SavedAccount) => acc.id !== accountId);
    localStorage.setItem("saved_accounts", JSON.stringify(filteredAccounts));
    loadSavedAccounts();
    toast.success("تم حذف الحساب من القائمة المحفوظة");
  };

  const createNewAccount = async () => {
    // التحقق البسيط من البيانات - لا يتطلب بريد صحيح
    if (!newAccount.email.trim() || !newAccount.password || !newAccount.name.trim()) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }

    // التحقق من كلمة المرور البسيطة (3 أحرف على الأقل)
    if (newAccount.password.length < 3) {
      toast.error("كلمة المرور يجب أن تكون 3 أحرف على الأقل");
      return;
    }

    setIsLoading(true);
    
    try {
      // إنشاء "بريد إلكتروني" وهمي إذا لم يحتوي على @
      let emailForAuth = newAccount.email.trim();
      if (!emailForAuth.includes('@')) {
        emailForAuth = `${emailForAuth}@local.app`;
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailForAuth,
        password: newAccount.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: newAccount.name.trim(),
            username: newAccount.name.trim(),
            name: newAccount.name.trim()
          }
        }
      });

      if (error) {
        // رسالة خطأ مبسطة
        toast.error("فشل في إنشاء الحساب. جرب بيانات أخرى");
        return;
      }

      if (data.user) {
        toast.success("تم إنشاء الحساب بنجاح!");
        setNewAccount({ email: "", password: "", name: "" });
        setShowAccountDialog(false);
      }
    } catch (error) {
      logger.error('خطأ في إنشاء الحساب', error, 'AccountSwitcher');
      toast.error("حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setIsLoading(false);
    }
  };


  const formatLastLogin = (date: string) => {
    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "منذ دقائق";
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    return `منذ ${Math.floor(diffInHours / 24)} يوم`;
  };

  // عرض التاريخ الميلادي بدل الهجري
  const formatGregorianDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        calendar: 'gregory',
        numberingSystem: 'latn'
      });
    } catch {
      return '';
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Account Switcher Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <Badge variant="secondary" className="w-fit text-xs">
                {user.role.nameAr}
              </Badge>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Saved Accounts */}
          {savedAccounts.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                الحسابات المحفوظة
              </DropdownMenuLabel>
              {savedAccounts.slice(0, 3).map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => switchToAccount(account)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={account.avatar} alt={account.name} />
                    <AvatarFallback className="text-xs">
                      {account.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {account.email}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Actions */}
          <DropdownMenuItem onClick={saveCurrentAccount}>
            <Users className="mr-2 h-4 w-4" />
            <span>حفظ الحساب الحالي</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowAccountDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>إنشاء حساب جديد</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={logout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إنشاء حساب جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات الحساب الجديد. يمكن استخدام أي اسم مستخدم وكلمة مرور بسيطة (3 أحرف على الأقل).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">الاسم</Label>
              <Input
                id="new-name"
                value={newAccount.name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل الاسم"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="new-email">اسم المستخدم أو البريد</Label>
              <Input
                id="new-email"
                type="text"
                value={newAccount.email}
                onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                placeholder="أدخل اسم المستخدم (يمكن أي نص)"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="new-password">كلمة المرور (3 أحرف على الأقل)</Label>
              <Input
                id="new-password"
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                placeholder="أدخل كلمة مرور بسيطة"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAccountDialog(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button onClick={createNewAccount} disabled={isLoading}>
              {isLoading ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}