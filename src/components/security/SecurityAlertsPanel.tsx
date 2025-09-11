import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function SecurityAlertsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          تنبيهات الأمان
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            نظام التنبيهات الأمنية غير متاح حالياً. يتطلب إعداد جداول قاعدة البيانات المطلوبة.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}