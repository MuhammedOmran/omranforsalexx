import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Shield, 
  Download, 
  Palette, 
  Settings,
  HardDrive
} from 'lucide-react';
import { CompanySetup } from '@/components/ui/company-setup';
import { LicenseActivation } from '@/components/ui/license-activation';
import { ElectronBackupManager } from '@/components/ui/electron-backup-manager';
import { ElectronStatus } from '@/components/ui/electron-status';

export function EnterpriseSettings() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات النظام</h1>
          <p className="text-muted-foreground">إدارة إعدادات التطبيق والشركة</p>
        </div>
        <ElectronStatus />
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            بيانات الشركة
          </TabsTrigger>
          <TabsTrigger value="license" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الترخيص
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            النسخ الاحتياطي
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            النظام
          </TabsTrigger>
        </TabsList>

        {/* بيانات الشركة */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                إعداد بيانات الشركة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompanySetup />
            </CardContent>
          </Card>
        </TabsContent>

        {/* إدارة التراخيص */}
        <TabsContent value="license" className="space-y-6">
          <LicenseActivation />
        </TabsContent>

        {/* النسخ الاحتياطي */}
        <TabsContent value="backup" className="space-y-6">
          <ElectronBackupManager />
        </TabsContent>

        {/* إعدادات النظام */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* معلومات النظام */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">إصدار التطبيق:</span>
                    <Badge variant="secondary">2.0.0</Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">تاريخ البناء:</span>
                    <span className="text-sm">{new Date().toLocaleDateString('ar-SA')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">بيئة التشغيل:</span>
                    <ElectronStatus />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المتصفح:</span>
                    <span className="text-sm">{navigator.userAgent.split(' ')[0]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات التخزين */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات التخزين</CardTitle>
              </CardHeader>
              <CardContent>
                <StorageStats />
              </CardContent>
            </Card>

            {/* تفضيلات التطبيق */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  تفضيلات التطبيق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppPreferences />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// مكون إحصائيات التخزين
function StorageStats() {
  const [stats, setStats] = useState<any>(null);

  React.useEffect(() => {
    // حساب إحصائيات التخزين
    const calculateStats = () => {
      let totalSize = 0;
      const items: any = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          const size = value ? value.length : 0;
          totalSize += size;
          
          if (key.startsWith('user_')) {
            const type = key.split('_')[2] || 'other';
            items[type] = (items[type] || 0) + size;
          } else {
            items.settings = (items.settings || 0) + size;
          }
        }
      }
      
      setStats({
        total: totalSize,
        items,
        count: localStorage.length
      });
    };

    calculateStats();
  }, []);

  if (!stats) {
    return <div>جاري تحميل الإحصائيات...</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">إجمالي المساحة:</span>
        <span className="text-sm font-medium">{formatBytes(stats.total)}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">عدد العناصر:</span>
        <span className="text-sm">{stats.count}</span>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">توزيع البيانات:</p>
        {Object.entries(stats.items).map(([type, size]) => (
          <div key={type} className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {type === 'customers' ? 'العملاء' :
               type === 'products' ? 'المنتجات' :
               type === 'sales_invoices' ? 'فواتير المبيعات' :
               type === 'settings' ? 'الإعدادات' : type}:
            </span>
            <span>{formatBytes(size as number)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// مكون تفضيلات التطبيق
function AppPreferences() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dark_mode') === 'true' ? 'dark' : 'light';
  });
  
  const [language, setLanguage] = useState('ar');
  const [autoSave, setAutoSave] = useState(true);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('dark_mode', newTheme === 'dark' ? 'true' : 'false');
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">المظهر</label>
        <select 
          value={theme} 
          onChange={(e) => handleThemeChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="light">فاتح</option>
          <option value="dark">داكن</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">اللغة</label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-2 space-x-reverse">
        <input 
          type="checkbox" 
          id="auto-save" 
          checked={autoSave}
          onChange={(e) => setAutoSave(e.target.checked)}
        />
        <label htmlFor="auto-save" className="text-sm">الحفظ التلقائي</label>
      </div>
    </div>
  );
}