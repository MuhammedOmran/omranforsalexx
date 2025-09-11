import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Crown,
  Clock,
  Zap,
  TrendingUp
} from "lucide-react";
import { useLicense } from "@/hooks/useLicense";
import { toast } from "@/hooks/use-toast";

export function LicenseStatus() {
  const { licenseInfo, loading, error, refreshLicense, addLicense, extendLicense } = useLicense();

  const handleRefresh = async () => {
    try {
      await refreshLicense();
      toast({
        title: "تم تحديث معلومات الترخيص",
        description: "تم جلب أحدث معلومات الترخيص بنجاح",
      });
    } catch (err) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث معلومات الترخيص",
        variant: "destructive"
      });
    }
  };

  const handleAddTestLicense = async () => {
    try {
      await addLicense(365, 'yearly');
      toast({
        title: "تم إضافة ترخيص سنوي",
        description: "تم إضافة ترخيص سنوي لمدة سنة واحدة",
      });
    } catch (err) {
      toast({
        title: "خطأ في إضافة الترخيص",
        description: "فشل في إضافة الترخيص السنوي",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'تاريخ غير صالح';
    }
  };

  const getLicenseStatusColor = () => {
    if (!licenseInfo.has_active_license) return 'destructive';
    if (licenseInfo.days_remaining <= 7) return 'secondary';
    return 'default';
  };

  const getLicenseStatusIcon = () => {
    if (!licenseInfo.has_active_license) return <AlertTriangle className="h-5 w-5" />;
    if (licenseInfo.days_remaining <= 7) return <Clock className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getLicenseTypeDetails = (type: string | null) => {
    const types = {
      trial: { name: 'تجريبي', color: 'bg-yellow-100 text-yellow-800', icon: <Zap className="h-4 w-4" /> },
      free: { name: 'مجاني', color: 'bg-gray-100 text-gray-800', icon: <Shield className="h-4 w-4" /> },
      yearly: { name: 'سنوي', color: 'bg-blue-100 text-blue-800', icon: <Crown className="h-4 w-4" /> },
      quarterly: { name: 'ربع سنوي', color: 'bg-orange-100 text-orange-800', icon: <Crown className="h-4 w-4" /> },
      monthly: { name: 'شهري', color: 'bg-green-100 text-green-800', icon: <Crown className="h-4 w-4" /> },
      premium: { name: 'مميز', color: 'bg-blue-100 text-blue-800', icon: <Crown className="h-4 w-4" /> },
      enterprise: { name: 'المؤسسات', color: 'bg-purple-100 text-purple-800', icon: <TrendingUp className="h-4 w-4" /> }
    };
    return types[type as keyof typeof types] || types.free;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            حالة الترخيص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>جاري تحميل معلومات الترخيص...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            حالة الترخيص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              خطأ في تحميل معلومات الترخيص: {error}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} variant="outline" className="mt-3">
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  const licenseTypeDetails = getLicenseTypeDetails(licenseInfo.license_type);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            حالة الترخيص
          </CardTitle>
          <CardDescription>
            معلومات تفصيلية عن ترخيص النظام الحالي
          </CardDescription>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* الحالة العامة */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getLicenseStatusIcon()}
            <div>
              <h4 className="font-medium">الحالة العامة</h4>
              <p className="text-sm text-muted-foreground">
                {licenseInfo.has_active_license ? 'الترخيص نشط ويعمل بشكل طبيعي' : 'الترخيص غير نشط'}
              </p>
            </div>
          </div>
          <Badge variant={getLicenseStatusColor()}>
            {licenseInfo.has_active_license ? 'نشط' : 'غير نشط'}
          </Badge>
        </div>

        {/* تفاصيل الترخيص */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">نوع الترخيص</h4>
            <div className={`flex items-center gap-2 p-3 rounded-lg ${licenseTypeDetails.color}`}>
              {licenseTypeDetails.icon}
              <span className="font-medium">{licenseTypeDetails.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">الأيام المتبقية</h4>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {licenseInfo.days_remaining.toLocaleString('ar-EG')}
                </span>
                <span className="text-sm text-muted-foreground">يوم</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">تاريخ الانتهاء</h4>
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium">
                {formatDate(licenseInfo.end_date)}
              </p>
            </div>
          </div>
        </div>

        {/* التحذيرات */}
        {!licenseInfo.has_active_license && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              الترخيص غير نشط. قد تكون بعض الميزات المتقدمة غير متاحة.
            </AlertDescription>
          </Alert>
        )}

        {licenseInfo.has_active_license && licenseInfo.days_remaining <= 7 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              تنبيه هام: الترخيص سينتهي خلال {licenseInfo.days_remaining} أيام. 
              يرجى تجديد الترخيص لتجنب انقطاع الخدمة.
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  );
}