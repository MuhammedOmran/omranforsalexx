import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Settings, 
  Info, 
  Phone, 
  LogOut,
  Edit3,
  Check,
  X
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserProfileSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function UserProfileSidebar({ activeSection, onSectionChange }: UserProfileSidebarProps) {
  const { user, profile, signOut, loading } = useSupabaseAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [companyName, setCompanyName] = useState('عمران للمبيعات');
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  useEffect(() => {
    const savedCompanyName = localStorage.getItem('company_name');
    if (savedCompanyName) {
      setCompanyName(savedCompanyName);
    }
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast.error("حدث خطأ أثناء تسجيل الخروج");
      } else {
        toast.success("تم تسجيل الخروج بنجاح");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSaveCompanyName = () => {
    localStorage.setItem('company_name', companyName);
    setIsEditingCompany(false);
    toast.success('تم تحديث اسم الشركة بنجاح');
  };

  const handleCancelEdit = () => {
    const savedCompanyName = localStorage.getItem('company_name') || 'عمران للمبيعات';
    setCompanyName(savedCompanyName);
    setIsEditingCompany(false);
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: User,
      description: 'إدارة البيانات الشخصية'
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: Settings,
      description: 'إعدادات التطبيق العامة'
    },
    {
      id: 'about',
      label: 'حول البرنامج',
      icon: Info,
      description: 'معلومات التطبيق والدعم'
    }
  ];

  if (loading) {
    return (
      <Card className="w-80">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile?.full_name || profile?.username || user?.email || 'مستخدم';
  const userEmail = user?.email || '';

  return (
    <Card className="w-80 h-fit">
      <CardContent className="p-6 space-y-6">
        {/* User Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            {isEditingCompany ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-center text-lg font-bold"
                  dir="rtl"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveCompanyName}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-primary">{companyName}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingCompany(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <Avatar className="h-20 w-20 mx-auto border-4 border-primary/20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              {userEmail}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12 text-right",
                activeSection === item.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => {
                if (onSectionChange) {
                  onSectionChange(item.id);
                }
              }}
            >
              <item.icon className="h-5 w-5" />
              <div className="flex-1 text-right">
                <div className="font-medium">{item.label}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            className="w-full justify-start gap-3 h-12"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-5 w-5" />
            <span>{isSigningOut ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}