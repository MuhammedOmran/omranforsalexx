import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Key, 
  Eye,
  Smartphone,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  FileText,
  Trash2
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "sonner";

export function SecurityPrivacySection() {
  const { user, resetPassword } = useSupabaseAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    activityTracking: true,
    dataSharing: false,
    emailNotifications: true,
    smsNotifications: false
  });

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setIsUpdating(true);
    try {
      const { error } = await resetPassword(user.email);
      if (error) {
        toast.error("حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور");
      } else {
        toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacySettingChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
    toast.success("تم تحديث إعدادات الخصوصية");
  };

  const securityActions = [
    {
      title: "تسجيل الدخول الأخير",
      description: "آخر تسجيل دخول: منذ ساعة واحدة",
      icon: Activity,
      status: "success"
    },
    {
      title: "الجلسات النشطة",
      description: "3 أجهزة متصلة حالياً",
      icon: Smartphone,
      status: "warning"
    },
    {
      title: "محاولات الدخول الفاشلة",
      description: "لا توجد محاولات مشبوهة",
      icon: AlertTriangle,
      status: "success"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">الأمان والخصوصية</h1>
          <p className="text-muted-foreground">إدارة إعدادات الحماية والخصوصية لحسابك</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Password & Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              كلمة المرور والمصادقة
            </CardTitle>
            <CardDescription>
              إدارة أمان الحساب وطرق المصادقة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">المصادقة الثنائية</Label>
                  <p className="text-sm text-muted-foreground">
                    طبقة حماية إضافية لحسابك
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>تغيير كلمة المرور</Label>
                <Button 
                  variant="outline" 
                  onClick={handlePasswordReset}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? 'جاري الإرسال...' : 'إرسال رابط إعادة تعيين كلمة المرور'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>آخر تغيير لكلمة المرور</Label>
                <Badge variant="outline">منذ 30 يوماً</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              إعدادات الخصوصية
            </CardTitle>
            <CardDescription>
              التحكم في مشاركة البيانات والخصوصية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {Object.entries(privacySettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">
                      {key === 'profileVisibility' && 'ظهور الملف الشخصي'}
                      {key === 'activityTracking' && 'تتبع النشاط'}
                      {key === 'dataSharing' && 'مشاركة البيانات'}
                      {key === 'emailNotifications' && 'إشعارات البريد الإلكتروني'}
                      {key === 'smsNotifications' && 'إشعارات الرسائل النصية'}
                    </Label>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handlePrivacySettingChange(key, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              حالة الأمان
            </CardTitle>
            <CardDescription>
              مراقبة أنشطة الحساب والأمان
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityActions.map((action, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <Badge 
                  variant={action.status === 'success' ? 'default' : 'secondary'}
                >
                  {action.status === 'success' ? 'آمن' : 'انتباه'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              إدارة البيانات
            </CardTitle>
            <CardDescription>
              تحكم في بياناتك الشخصية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                تصدير البيانات الشخصية
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2">
                <Lock className="h-4 w-4" />
                تنزيل سجل الأنشطة
              </Button>
              
              <Separator />
              
              <Button variant="destructive" className="w-full justify-start gap-2">
                <Trash2 className="h-4 w-4" />
                حذف الحساب نهائياً
              </Button>
              
              <p className="text-xs text-muted-foreground">
                تحذير: حذف الحساب عملية لا يمكن التراجع عنها
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}