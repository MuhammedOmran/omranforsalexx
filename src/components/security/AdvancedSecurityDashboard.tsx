import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export function AdvancedSecurityDashboard() {
  return (
    <div className="p-6">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>لوحة الأمان المتقدمة</AlertTitle>
        <AlertDescription>
          هذه الميزة غير متاحة حالياً. يتطلب إعداد جداول قاعدة البيانات المطلوبة للأمان المتقدم.
        </AlertDescription>
      </Alert>
    </div>
  );
}