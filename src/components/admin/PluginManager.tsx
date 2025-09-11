/**
 * واجهة إدارة الـ Plugins
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { pluginSystem } from '@/core/PluginSystem';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  RefreshCw, 
  Power, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Package
} from 'lucide-react';

interface PluginInfo {
  name: string;
  version: string;
  description: string;
}

export function PluginManager() {
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // تحميل معلومات الـ plugins
  const loadPluginInfo = async () => {
    try {
      const pluginInfo = pluginSystem.getPluginInfo();
      const allPlugins = pluginSystem.getAllPlugins();
      
      setPlugins(pluginInfo);
      setSystemStatus({
        totalPlugins: allPlugins.length,
        loadedPlugins: pluginInfo.length,
        health: 'healthy'
      });
    } catch (error) {
      console.error('Failed to load plugin info:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل معلومات الوحدات",
        variant: "destructive",
      });
    }
  };

  // إعادة تحميل plugin معين
  const reloadPlugin = async (pluginName: string) => {
    setLoading(true);
    try {
      const success = await pluginSystem.reloadPlugin(pluginName);
      
      if (success) {
        toast({
          title: "تم إعادة التحميل",
          description: `تم إعادة تحميل الوحدة ${pluginName} بنجاح`,
        });
        await loadPluginInfo();
      } else {
        throw new Error('Reload failed');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: `فشل في إعادة تحميل الوحدة ${pluginName}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // إعادة تحميل جميع الـ plugins
  const reloadAllPlugins = async () => {
    setLoading(true);
    try {
      await pluginSystem.cleanup();
      
      // إعادة تسجيل الـ plugins الأساسية
      const { salesPlugin } = await import('@/plugins/SalesPlugin');
      const { inventoryPlugin } = await import('@/plugins/InventoryPlugin');
      const { reportsPlugin } = await import('@/plugins/ReportsPlugin');
      
      pluginSystem.register(salesPlugin);
      pluginSystem.register(inventoryPlugin);
      pluginSystem.register(reportsPlugin);
      
      await pluginSystem.initialize();
      
      toast({
        title: "تم إعادة التحميل",
        description: "تم إعادة تحميل جميع الوحدات بنجاح",
      });
      
      await loadPluginInfo();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إعادة تحميل الوحدات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // تحديث إعدادات plugin
  const updatePluginConfig = async (pluginName: string, config: any) => {
    try {
      const success = pluginSystem.updatePluginConfig(pluginName, config);
      
      if (success) {
        toast({
          title: "تم التحديث",
          description: `تم تحديث إعدادات ${pluginName} بنجاح`,
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPluginInfo();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الوحدات</h1>
          <p className="text-muted-foreground">
            إدارة وتكوين وحدات النظام القابلة للتوسع
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadPluginInfo}
            disabled={loading}
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
          
          <Button
            onClick={reloadAllPlugins}
            disabled={loading}
          >
            <Power className="ml-2 h-4 w-4" />
            إعادة تحميل الكل
          </Button>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="ml-2 h-5 w-5 text-green-600" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{systemStatus.totalPlugins}</div>
                <div className="text-sm text-muted-foreground">إجمالي الوحدات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStatus.loadedPlugins}</div>
                <div className="text-sm text-muted-foreground">الوحدات المحملة</div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-green-600">
                  {systemStatus.health === 'healthy' ? 'سليم' : 'مشاكل'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="plugins" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plugins">الوحدات المحملة</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
        </TabsList>

        <TabsContent value="plugins" className="space-y-4">
          {plugins.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                لم يتم تحميل أي وحدات بعد. انقر على "إعادة تحميل الكل" لتحميل الوحدات الأساسية.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {plugins.map((plugin) => (
                <Card key={plugin.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <div>
                          <CardTitle>{plugin.name}</CardTitle>
                          <CardDescription>{plugin.description}</CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{plugin.version}</Badge>
                        <Switch
                          defaultChecked={true}
                          onCheckedChange={(checked) => {
                            // يمكن إضافة تفعيل/إلغاء تفعيل هنا
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="ml-1 h-3 w-3" />
                          محمل
                        </Badge>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reloadPlugin(plugin.name)}
                          disabled={loading}
                        >
                          <RefreshCw className="ml-1 h-3 w-3" />
                          إعادة تحميل
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // فتح إعدادات الـ plugin
                          }}
                        >
                          <Settings className="ml-1 h-3 w-3" />
                          إعدادات
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
              <CardDescription>
                تكوين الإعدادات العامة لنظام الوحدات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">التحميل التلقائي</div>
                  <div className="text-sm text-muted-foreground">
                    تحميل الوحدات تلقائياً عند بدء التطبيق
                  </div>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">مراقبة الأخطاء</div>
                  <div className="text-sm text-muted-foreground">
                    مراقبة أخطاء الوحدات وإرسال تقارير
                  </div>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">التحديث التلقائي</div>
                  <div className="text-sm text-muted-foreground">
                    البحث عن تحديثات الوحدات تلقائياً
                  </div>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجلات النظام</CardTitle>
              <CardDescription>
                عرض سجلات تشغيل الوحدات والأخطاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-green-600">[INFO] Plugin system initialized successfully</div>
                <div className="text-blue-600">[DEBUG] Sales Plugin loaded</div>
                <div className="text-blue-600">[DEBUG] Inventory Plugin loaded</div>
                <div className="text-blue-600">[DEBUG] Reports Plugin loaded</div>
                <div className="text-green-600">[INFO] All plugins initialized</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}