import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Palette, 
  FileText, 
  Building2, 
  Receipt, 
  Save, 
  Upload, 
  Download, 
  QrCode, 
  Printer,
  Globe,
  Trash2,
  RotateCcw,
  Copy,
} from "lucide-react";
import { useInvoiceSettings } from '@/contexts/InvoiceSettingsContext';
import { InvoiceAdvancedSettingsContent } from './InvoiceAdvancedSettingsContent';

interface InvoiceAdvancedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData?: any;
  onSettingsChange?: (settings: any) => void;
}

export function InvoiceAdvancedSettings({ 
  isOpen, 
  onClose, 
  invoiceData,
  onSettingsChange 
}: InvoiceAdvancedSettingsProps) {
  const { 
    settings, 
    saveSettings, 
    resetSettings, 
    copySettings, 
    exportSettings, 
    importSettings,
    isLoading
  } = useInvoiceSettings();

  const [activeTab, setActiveTab] = useState('appearance');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importSettings(file);
      } catch (error) {
        console.error('Settings import failed:', error);
      }
    }
  };

  const handleSaveSettings = () => {
    saveSettings();
    onSettingsChange?.(settings);
  };

  const handleResetSettings = () => {
    resetSettings();
    onSettingsChange?.(settings);
  };

  const tabs = [
    {
      id: 'appearance',
      label: 'المظهر والتصميم',
      icon: Palette,
      description: 'تخصيص الألوان والخطوط والقوالب'
    },
    {
      id: 'content',
      label: 'المحتوى المتقدم',
      icon: FileText,
      description: 'تفاصيل العناصر والبيانات المعروضة'
    },
    {
      id: 'company',
      label: 'بيانات الشركة',
      icon: Building2,
      description: 'معلومات الشركة والتراخيص'
    },
    {
      id: 'print',
      label: 'إعدادات الطباعة',
      icon: Printer,
      description: 'خيارات الطباعة والتصدير'
    },
    {
      id: 'export',
      label: 'التصدير',
      icon: Download,
      description: 'خيارات تصدير PDF والملفات'
    },
    {
      id: 'integration',
      label: 'التكامل',
      icon: Globe,
      description: 'إعدادات الإرسال والتكامل'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            الإعدادات المتقدمة للفاتورة
          </DialogTitle>
          <DialogDescription>
            تخصيص شامل لمظهر ومحتوى الفاتورة والتحكم في جميع العناصر المعروضة
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* شريط التبويبات الجانبي */}
          <div className="w-64 bg-muted/30 border-r overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent gap-1 p-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="w-full justify-start h-auto p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        <span className="text-xs opacity-75 text-right">
                          {tab.description}
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* محتوى التبويبات */}
          <div className="flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-6 px-6 py-4">
              <InvoiceAdvancedSettingsContent 
                settings={settings}
                onSettingChange={() => {}}
                activeTab={activeTab}
              />
            </div>

            {/* شريط الإجراءات السفلي */}
            <div className="border-t bg-background p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    استيراد
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportSettings}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySettings}
                    disabled={isLoading}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetSettings}
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-4 w-4 ml-2" />
                    إعادة تعيين
                  </Button>
                  
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الإعدادات
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={onClose}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}