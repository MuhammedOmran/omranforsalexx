import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Star, Heart, MessageSquare, Share2, TrendingUp, Users, ShoppingCart } from "lucide-react";

interface ThemePreviewProps {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  density?: string;
  fontSize?: string;
}

export function ThemePreview({
  primaryColor = "#3b82f6",
  accentColor = "#64748b",
  fontFamily = "cairo",
  borderRadius = "medium",
  density = "comfortable",
  fontSize = "medium"
}: ThemePreviewProps) {
  
  const previewStyle = {
    '--primary': primaryColor,
    '--accent': accentColor,
  } as React.CSSProperties;

  const fontClass = `font-${fontFamily}`;
  const radiusClass = `radius-${borderRadius}`;
  const densityClass = `density-${density}`;
  const fontSizeClass = `font-size-${fontSize}`;

  return (
    <div 
      className={`p-6 border rounded-lg bg-background/50 ${fontClass} ${radiusClass} ${densityClass} ${fontSizeClass}`}
      style={previewStyle}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">لوحة التحكم</h2>
            <p className="text-muted-foreground">معاينة المظهر الجديد</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Share2 className="h-4 w-4 ml-2" />
              مشاركة
            </Button>
            <Button 
              size="sm" 
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              <Heart className="h-4 w-4 ml-2" />
              إعجاب
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold">45,231</p>
                </div>
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: primaryColor + '20' }}
                >
                  <TrendingUp 
                    className="h-6 w-6" 
                    style={{ color: primaryColor }}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Progress value={68} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">+12% من الشهر الماضي</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">العملاء النشطين</p>
                  <p className="text-2xl font-bold">2,350</p>
                </div>
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: accentColor + '20' }}
                >
                  <Users 
                    className="h-6 w-6" 
                    style={{ color: accentColor }}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Progress value={45} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">+8% من الشهر الماضي</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الطلبات الجديدة</p>
                  <p className="text-2xl font-bold">834</p>
                </div>
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: '#10b981' + '20' }}
                >
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3">
                <Progress value={82} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">+24% من الشهر الماضي</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">النشاط الأخير</CardTitle>
              <CardDescription>أحدث العمليات والتحديثات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">فاتورة جديدة #12345</p>
                  <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
                </div>
                <Badge variant="secondary">جديد</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">تحديث بيانات العميل</p>
                  <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
                </div>
                <Badge variant="outline">معلق</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">تم إتمام الدفع</p>
                  <p className="text-xs text-muted-foreground">منذ 30 دقيقة</p>
                </div>
                <Badge className="bg-green-100 text-green-800">مكتمل</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإجراءات السريعة</CardTitle>
              <CardDescription>الوظائف الأكثر استخداماً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">رسالة جديدة</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  style={{ 
                    borderColor: primaryColor,
                    color: primaryColor 
                  }}
                >
                  <Star className="h-5 w-5" />
                  <span className="text-sm">إضافة مفضلة</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm">عرض التقارير</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm">إدارة المستخدمين</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>هذه معاينة للمظهر الجديد • سيتم تطبيقها على كامل التطبيق</p>
        </div>
      </div>
    </div>
  );
}