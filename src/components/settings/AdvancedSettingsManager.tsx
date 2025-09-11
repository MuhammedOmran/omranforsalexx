import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building2, Palette, Bell, Download, Shield, Zap, Key } from "lucide-react";

// Import tab components
import { GeneralSettings } from './tabs/GeneralSettings';
import { CompanySettings } from './tabs/CompanySettings';
import { AppearanceSettings } from './tabs/AppearanceSettings';
import { NotificationSettings } from './tabs/NotificationSettings';
import { BackupSettings } from './tabs/BackupSettings';
import { SecuritySettings } from './tabs/SecuritySettings';
import { LicenseSettings } from './tabs/LicenseSettings';
import { PerformanceSettings } from './tabs/PerformanceSettings';

export function AdvancedSettingsManager() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'عام', icon: SettingsIcon },
    { id: 'company', label: 'الشركة', icon: Building2 },
    { id: 'appearance', label: 'المظهر واللغة', icon: Palette },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Download },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'performance', label: 'الأداء', icon: Zap },
    { id: 'license', label: 'الترخيص', icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">الإعدادات المتقدمة</h1>
          <p className="text-muted-foreground">إدارة شاملة لجميع إعدادات التطبيق والنظام</p>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex items-center gap-2 min-w-fit px-3"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* محتوى التبويبات */}
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="backup">
          <BackupSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceSettings />
        </TabsContent>

        <TabsContent value="license">
          <LicenseSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}