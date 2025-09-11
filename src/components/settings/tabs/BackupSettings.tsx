import React from 'react';
import { BackupSystem } from '@/components/ui/backup-system';
import { BackupManagementPanel } from '@/components/admin/BackupManagementPanel';
import { BackupAnalyticsDashboard } from '@/components/admin/BackupAnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Shield, BarChart3 } from 'lucide-react';

export function BackupSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">إعدادات النسخ الاحتياطي</h2>
        <p className="text-muted-foreground">
          إدارة النسخ الاحتياطية لحماية بياناتك
        </p>
      </div>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            النسخ الأساسي
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            النسخ المتقدم
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <BackupSystem />
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <BackupManagementPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <BackupAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}