import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, MapPin, Phone, Building, Save, Upload } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProfileSection() {
  const { user, profile, updateProfile, loading } = useSupabaseAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    phone: '',
    location: '',
    company: '',
    website: '',
    email: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: (profile as any).bio || '',
        phone: (profile as any).phone || '',
        location: (profile as any).location || '',
        company: (profile as any).company || '',
        website: (profile as any).website || '',
        email: user?.email || ''
      });
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صحيح');
      return;
    }

    // التحقق من حجم الملف (5MB حد أقصى)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // إنشاء اسم ملف فريد داخل مجلد المستخدم ليتوافق مع سياسات RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // رفع الملف إلى storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // الحصول على URL العام للملف
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // تحديث الملف الشخصي
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl
      });

      if (updateError) throw updateError;

      toast.success('تم تحديث الصورة الشخصية بنجاح');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('حدث خطأ أثناء رفع الصورة: ' + error.message);
    } finally {
      setIsUploadingAvatar(false);
      // مسح اختيار الملف
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    try {
      // تحديث الملف الشخصي
      const profileData = {
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        company: formData.company,
        website: formData.website
      };

      const { error } = await updateProfile(profileData);
      
      if (error) {
        toast.error("حدث خطأ أثناء تحديث الملف الشخصي");
      } else {
        toast.success("تم تحديث الملف الشخصي بنجاح");
        
        // إذا تم تغيير البريد الإلكتروني، اطلب من المستخدم التحقق
        if (formData.email !== user?.email && formData.email) {
          try {
            const { error: emailError } = await supabase.auth.updateUser({
              email: formData.email
            });
            
            if (emailError) {
              toast.error("حدث خطأ أثناء تحديث البريد الإلكتروني: " + emailError.message);
            } else {
              toast.info("تم إرسال رابط تأكيد إلى البريد الإلكتروني الجديد");
            }
          } catch (emailError) {
            console.error('Error updating email:', emailError);
            toast.error("حدث خطأ أثناء تحديث البريد الإلكتروني");
          }
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '';
  const displayName = profile?.full_name || profile?.username || user?.email || 'مستخدم';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">الملف الشخصي</h1>
          <p className="text-muted-foreground">إدارة بياناتك الشخصية ومعلومات الحساب</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              نظرة عامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Upload className="h-4 w-4" />
                {isUploadingAvatar ? 'جاري الرفع...' : 'تغيير الصورة'}
              </Button>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">{displayName}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>البريد الإلكتروني</span>
                <Badge variant={user?.email_confirmed_at ? "default" : "destructive"} className="mr-auto">
                  {user?.email_confirmed_at ? "مؤكد" : "غير مؤكد"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>تاريخ التسجيل</span>
                <span className="mr-auto text-muted-foreground">{joinDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="mr-auto">
                  نشط
                </Badge>
                <span>حالة الحساب</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>البيانات الشخصية</CardTitle>
            <CardDescription>
              قم بتحديث معلوماتك الشخصية هنا
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                />
                <p className="text-xs text-muted-foreground">
                  سيتم إرسال رابط تأكيد للبريد الجديد عند التغيير
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">الموقع</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="أدخل موقعك"
                />
              </div>

            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">نبذة شخصية</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="اكتب نبذة مختصرة عنك..."
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={isUpdating}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}