import { MonitoringDashboard } from "@/components/ui/monitoring-dashboard";
// import { useComponentMonitoring } from "@/hooks/useMonitoring"; // إزالة مؤقتة
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { EnhancedHealthDashboard } from "@/components/admin/EnhancedHealthDashboard";
import { BackupManagementDashboard } from "@/components/admin/BackupManagementDashboard";
import { UsageAnalyticsDashboard } from "@/components/admin/UsageAnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Shield, Database, BarChart3 } from "lucide-react";

export default function MonitoringPage() {
  // useComponentMonitoring('MonitoringPage'); // إزالة مؤقتة حتى يتم إصلاح الهوك

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* العنوان والوصف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            مراقبة النظام والصيانة
          </CardTitle>
          <CardDescription>
            نظام شامل لمراقبة صحة النظام وإحصائيات الاستخدام وإدارة النسخ الاحتياطية
          </CardDescription>
        </CardHeader>
      </Card>

      {/* التبويبات */}
      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            المراقبة العامة
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            فحوصات الصحة
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            النسخ الاحتياطية
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            إحصائيات الاستخدام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <MonitoringDashboard />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <EnhancedHealthDashboard />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <BackupManagementDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <UsageAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* مراقب الأداء العائم */}
      <PerformanceMonitor />
    </div>
  );
}