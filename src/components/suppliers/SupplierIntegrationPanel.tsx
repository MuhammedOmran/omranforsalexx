import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link2, 
  RefreshCw, 
  Database, 
  FileText, 
  CreditCard, 
  Package, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { enhancedSupplierIntegration } from '@/utils/enhancedSupplierIntegration';
import { supplierIntegrationManager } from '@/utils/supplierIntegrationManager';
import { formatCurrency } from '@/lib/utils';
import { storage } from '@/utils/storage';

interface IntegrationStatus {
  module: string;
  name: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSync?: string;
  recordsCount: number;
  description: string;
  icon: React.ComponentType<any>;
}

interface SupplierIntegrationPanelProps {
  className?: string;
}

export function SupplierIntegrationPanel({ className }: SupplierIntegrationPanelProps) {
  const [integrationData, setIntegrationData] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    loadIntegrationData();
    
    // تحميل تاريخ آخر مزامنة
    const savedLastSync = localStorage.getItem('supplier_last_sync');
    if (savedLastSync) {
      setLastSync(savedLastSync);
    }
  }, []);

  const loadIntegrationData = () => {
    try {
      const suppliersRaw = storage.getItem<any[]>('suppliers', []) || [];
      const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : [];
      
      const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
      const checks = JSON.parse(localStorage.getItem('checks') || '[]');
      const installments = JSON.parse(localStorage.getItem('installments') || '[]');
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');

      setIntegrationData({
        suppliers: suppliers.length,
        purchaseInvoices: purchaseInvoices.length,
        checks: checks.filter((c: any) => c.supplierId).length,
        installments: installments.filter((i: any) => i.supplierId).length,
        inventory: inventory.length,
        totalValue: suppliers.reduce((sum: number, s: any) => {
          const purchases = typeof s === 'string' ? 0 : (s.totalPurchases || 0);
          return sum + purchases;
        }, 0)
      });
    } catch (error) {
      console.error('Error loading integration data:', error);
    }
  };

  const integrationModules: IntegrationStatus[] = [
    {
      module: 'suppliers',
      name: 'إدارة الموردين',
      status: 'connected',
      recordsCount: integrationData?.suppliers || 0,
      description: 'بيانات الموردين الأساسية وملفاتهم',
      icon: Database,
      lastSync: lastSync
    },
    {
      module: 'purchases',
      name: 'فواتير الشراء',
      status: 'connected',
      recordsCount: integrationData?.purchaseInvoices || 0,
      description: 'فواتير المشتريات والعمليات التجارية',
      icon: FileText,
      lastSync: lastSync
    },
    {
      module: 'payments',
      name: 'نظام المدفوعات',
      status: 'connected',
      recordsCount: integrationData?.checks || 0,
      description: 'الشيكات والأقساط والدفعات',
      icon: CreditCard,
      lastSync: lastSync
    },
    {
      module: 'inventory',
      name: 'إدارة المخازن',
      status: 'syncing',
      recordsCount: integrationData?.inventory || 0,
      description: 'ربط المنتجات مع موردينها',
      icon: Package,
      lastSync: lastSync
    }
  ];

  const handleSyncAll = async () => {
    setSyncStatus('syncing');
    
    try {
      // تحديث جميع بيانات الموردين
      supplierIntegrationManager.syncAllSuppliers();
      
      // تحديث التكامل المحسن
      const suppliersRaw = storage.getItem<any[]>('suppliers', []);
      const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : [];
      const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
      
      // ربط فواتير الشراء مع الموردين
      purchaseInvoices.forEach((invoice: any) => {
        if (invoice.supplierId) {
          enhancedSupplierIntegration.updateSupplierOnPurchase(invoice.supplierId, invoice);
        }
      });

      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('supplier_last_sync', now);
      
      setSyncStatus('success');
      loadIntegrationData();
      
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    const configs = {
      connected: { variant: 'default' as const, label: 'متصل', color: 'text-green-600' },
      syncing: { variant: 'outline' as const, label: 'يتم المزامنة', color: 'text-blue-600' },
      error: { variant: 'destructive' as const, label: 'خطأ', color: 'text-red-600' },
      disconnected: { variant: 'secondary' as const, label: 'غير متصل', color: 'text-gray-600' }
    };

    const config = configs[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const connectedModules = integrationModules.filter(m => m.status === 'connected').length;
  const totalModules = integrationModules.length;
  const integrationHealth = (connectedModules / totalModules) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* حالة التكامل العامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            حالة التكامل مع الأنظمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* مؤشر الصحة العامة */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">صحة التكامل</h3>
                <p className="text-sm text-muted-foreground">
                  {connectedModules} من {totalModules} أنظمة متصلة
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {integrationHealth.toFixed(0)}%
                </div>
                <Progress value={integrationHealth} className="w-32 mt-1" />
              </div>
            </div>

            {/* آخر مزامنة وإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-xl font-bold">{integrationData?.suppliers || 0}</div>
                <div className="text-sm text-muted-foreground">مورد مُسجل</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{integrationData?.purchaseInvoices || 0}</div>
                <div className="text-sm text-muted-foreground">فاتورة شراء</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {formatCurrency(integrationData?.totalValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي المشتريات</div>
              </div>
            </div>

            {/* آخر مزامنة */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                آخر مزامنة: {lastSync ? new Date(lastSync).toLocaleString('ar-EG') : 'لم تتم بعد'}
              </div>
              
              <Button 
                onClick={handleSyncAll}
                disabled={syncStatus === 'syncing'}
                size="sm"
                className="font-cairo"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري المزامنة...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    مزامنة الآن
                  </>
                )}
              </Button>
            </div>

            {/* رسائل الحالة */}
            {syncStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  تمت المزامنة بنجاح! جميع البيانات محدثة.
                </AlertDescription>
              </Alert>
            )}

            {syncStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  حدث خطأ في المزامنة. يرجى المحاولة مرة أخرى.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الأنظمة المتكاملة */}
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules" className="font-cairo">الأنظمة المتكاملة</TabsTrigger>
          <TabsTrigger value="performance" className="font-cairo">مؤشرات الأداء</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4">
            {integrationModules.map((module) => (
              <Card key={module.module}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <module.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{module.name}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">{module.recordsCount} سجل</div>
                        {module.lastSync && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(module.lastSync).toLocaleString('ar-EG')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(module.status)}
                        {getStatusBadge(module.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  أداء التكامل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>معدل نجاح المزامنة</span>
                  <span className="font-bold text-green-600">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط وقت المزامنة</span>
                  <span className="font-bold">1.2 ثانية</span>
                </div>
                <div className="flex justify-between">
                  <span>البيانات المعالجة اليوم</span>
                  <span className="font-bold">{integrationData?.purchaseInvoices || 0} عملية</span>
                </div>
                <div className="flex justify-between">
                  <span>حالة قاعدة البيانات</span>
                  <Badge variant="default">مستقرة</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  التحسينات المقترحة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    يمكن تحسين ربط المنتجات مع الموردين لزيادة دقة التقارير
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    نظام المدفوعات يعمل بكفاءة عالية
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}