import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Info, 
  Heart,
  Github,
  Mail,
  Globe,
  Download,
  Star,
  Users,
  Calendar,
  Cpu,
  Phone
} from "lucide-react";

export function AboutSection() {
  const appInfo = {
    name: "عمران للمبيعات",
    version: "1.0.0",
    build: "2025.09.25",
    developer: "Mohamed Ali Omran",
    license: "Commercial License",
    releaseDate: "سبتمبر 2025",
    lastUpdate: "25 سبتمبر 2025"
  };

  const features = [
    "إدارة المبيعات والفواتير",
    "إدارة المخزون والمنتجات", 
    "إدارة العملاء والموردين",
    "التقارير والإحصائيات",
    "النسخ الاحتياطي التلقائي",
    "الأمان والحماية المتقدمة"
  ];

  const systemInfo = [
    { label: "نظام التشغيل", value: navigator.platform },
    { label: "المتصفح", value: navigator.userAgent.split(' ')[0] },
    { label: "دقة الشاشة", value: `${screen.width}x${screen.height}` },
    { label: "المنطقة الزمنية", value: Intl.DateTimeFormat().resolvedOptions().timeZone }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Info className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">حول البرنامج</h1>
          <p className="text-muted-foreground">معلومات التطبيق والنظام والدعم الفني</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              معلومات التطبيق
            </CardTitle>
            <CardDescription>
              تفاصيل الإصدار والتطوير
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">اسم التطبيق</span>
                <Badge variant="outline">{appInfo.name}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">الإصدار</span>
                <Badge>{appInfo.version}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">رقم البناء</span>
                <span className="text-muted-foreground">{appInfo.build}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">المطور</span>
                <span className="text-muted-foreground">{appInfo.developer}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">نوع الترخيص</span>
                <Badge variant="secondary">{appInfo.license}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">تاريخ الإصدار</span>
                <span className="text-muted-foreground">{appInfo.releaseDate}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">آخر تحديث</span>
                <span className="text-muted-foreground">{appInfo.lastUpdate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              معلومات النظام
            </CardTitle>
            <CardDescription>
              تفاصيل البيئة التشغيلية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {systemInfo.map((info, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{info.label}</span>
                  <span className="text-muted-foreground text-sm max-w-[60%] truncate">
                    {info.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              الميزات الرئيسية
            </CardTitle>
            <CardDescription>
              قائمة بأهم ميزات التطبيق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support & Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              الدعم والتواصل
            </CardTitle>
            <CardDescription>
              طرق التواصل والحصول على المساعدة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="h-4 w-4" />
                xoxobnj@gmail.com
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2">
                <Phone className="h-4 w-4" />
                01090695336
              </Button>
            </div>

            <Separator />
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                صنع بـ <Heart className="h-4 w-4 inline text-red-500" /> في مصر
              </p>
              <p className="text-xs text-muted-foreground">
                © 2025 Omran Sales. جميع الحقوق محفوظة.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}