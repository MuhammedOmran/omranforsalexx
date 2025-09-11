import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Clock, XCircle, User, Building, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useChecks, Check } from '@/hooks/useChecks';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';


interface ChecksByEntityDashboardProps {
  entityId?: string;
  entityType?: 'customer' | 'supplier';
}

export const ChecksByEntityDashboard = ({ entityId, entityType }: ChecksByEntityDashboardProps) => {
  const { checks, loading, getChecksByEntity, getCheckStatistics } = useChecks();
  const { user } = useSupabaseAuth();
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entityId || '');
  const [selectedEntityType, setSelectedEntityType] = useState<'customer' | 'supplier'>(entityType || 'customer');

  useEffect(() => {
    loadEntities();
  }, [selectedEntityType, user]);

  const loadEntities = async () => {
    if (!user) return;
    
    try {
      const tableName = selectedEntityType === 'customer' ? 'customers' : 'suppliers';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  };

  const getStatusIcon = (status: Check['status']) => {
    switch (status) {
      case 'cashed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'bounced': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'returned': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: Check['status']) => {
    switch (status) {
      case 'cashed': return 'default';
      case 'bounced': return 'destructive';
      case 'returned': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Check['status']) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'cashed': return 'مصروف';
      case 'bounced': return 'مرتجع';
      case 'returned': return 'مُرجع';
    }
  };

  const getEntityChecksStats = (entityId: string) => {
    const entityChecks = checks.filter(check => 
      (selectedEntityType === 'customer' && check.customer_id === entityId) ||
      (selectedEntityType === 'supplier' && check.supplier_id === entityId)
    );

    const pending = entityChecks.filter(c => c.status === 'pending');
    const cashed = entityChecks.filter(c => c.status === 'cashed');
    const bounced = entityChecks.filter(c => c.status === 'bounced');

    return {
      total: entityChecks.length,
      pending: pending.length,
      cashed: cashed.length,
      bounced: bounced.length,
      totalAmount: entityChecks.reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: pending.reduce((sum, c) => sum + c.amount, 0)
    };
  };

  const filteredChecks = selectedEntityId 
    ? checks.filter(check => 
        (selectedEntityType === 'customer' && check.customer_id === selectedEntityId) ||
        (selectedEntityType === 'supplier' && check.supplier_id === selectedEntityId)
      )
    : checks;

  const stats = getCheckStatistics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الشيكات</h2>
          <p className="text-muted-foreground">
            متابعة وإدارة الشيكات المستقبلة من العملاء والموردين
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 ml-2" />
            إضافة شيك جديد
          </Button>
        </div>
      </div>

      <Tabs value={selectedEntityType} onValueChange={(value) => setSelectedEntityType(value as 'customer' | 'supplier')}>
        <TabsList>
          <TabsTrigger value="customer">
            <User className="h-4 w-4 ml-2" />
            العملاء
          </TabsTrigger>
          <TabsTrigger value="supplier">
            <Building className="h-4 w-4 ml-2" />
            الموردين
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedEntityType} className="space-y-6">
          {/* قائمة الكيانات مع إحصائيات الشيكات */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => {
              const stats = getEntityChecksStats(entity.id);
              return (
                <Card 
                  key={entity.id} 
                  className={`cursor-pointer transition-all ${
                    selectedEntityId === entity.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedEntityId(selectedEntityId === entity.id ? '' : entity.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{entity.name}</span>
                      {stats.total > 0 && (
                        <Badge variant="secondary">{stats.total}</Badge>
                      )}
                    </CardTitle>
                    {entity.phone && (
                      <CardDescription>{entity.phone}</CardDescription>
                    )}
                  </CardHeader>
                  
                  {stats.total > 0 && (
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">معلق:</span>
                            <span>{stats.pending}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">مصروف:</span>
                            <span className="text-success">{stats.cashed}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">مرتجع:</span>
                            <span className="text-destructive">{stats.bounced}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">إجمالي المبلغ</div>
                            <div className="font-semibold">{stats.totalAmount.toLocaleString()} ر.س</div>
                          </div>
                          {stats.pendingAmount > 0 && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">المعلق</div>
                              <div className="font-semibold text-warning">{stats.pendingAmount.toLocaleString()} ر.س</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* قائمة الشيكات للكيان المحدد */}
          {selectedEntityId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  شيكات {entities.find(e => e.id === selectedEntityId)?.name}
                </CardTitle>
                <CardDescription>
                  عدد الشيكات: {filteredChecks.length} - 
                  إجمالي المبلغ: {filteredChecks.reduce((sum, c) => sum + c.amount, 0).toLocaleString()} ر.س
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredChecks.map((check) => (
                    <div 
                      key={check.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(check.status)}
                        <div>
                          <div className="font-medium">شيك رقم {check.check_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {check.bank_name} • تاريخ الاستحقاق: {new Date(check.due_date).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="font-semibold">{check.amount.toLocaleString()} ر.س</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(check.date_received).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(check.status)}>
                          {getStatusText(check.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {filteredChecks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد شيكات لهذا {selectedEntityType === 'customer' ? 'العميل' : 'المورد'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* إحصائيات عامة عند عدم تحديد كيان */}
          {!selectedEntityId && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">شيكات معلقة</div>
                      <div className="text-2xl font-bold">
                        {stats.pendingCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <div className="text-sm text-muted-foreground">شيكات مصروفة</div>
                      <div className="text-2xl font-bold">
                        {stats.cashedCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <div className="text-sm text-muted-foreground">شيكات مرتجعة</div>
                      <div className="text-2xl font-bold">
                        {stats.bouncedCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">إجمالي المبلغ</div>
                      <div className="text-2xl font-bold">
                        {(stats.totalCashedAmount + stats.totalPendingAmount + stats.totalBouncedAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};