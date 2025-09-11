import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, History } from 'lucide-react';
import { LicenseStatus } from '@/components/license/LicenseStatus';
import { LicenseHistory } from './license/LicenseHistory';

export function LicenseSettings() {
  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            إدارة الترخيص
          </CardTitle>
          <CardDescription>
            إدارة شاملة لترخيص النظام وتفعيل الميزات المتقدمة
          </CardDescription>
        </CardHeader>
      </Card>

      {/* التبويبات */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الحالة
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            السجل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <LicenseStatus />
        </TabsContent>


        <TabsContent value="history">
          <LicenseHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}