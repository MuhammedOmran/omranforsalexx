import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Calendar, 
  Shield, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

interface LicenseHistoryItem {
  id: string;
  license_type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  license_duration: number;
}

export function LicenseHistory() {
  const [history, setHistory] = useState<LicenseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  const loadHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('خطأ في تحميل سجل التراخيص:', error);
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل سجل التراخيص",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLicenseTypeLabel = (type: string) => {
    const types = {
      trial: 'تجريبي',
      basic: 'أساسي',
      quarterly: 'ربع سنوي',
      yearly: 'سنوي',
      monthly: 'شهري',
      premium: 'مميز',
      enterprise: 'المؤسسات'
    };
    return types[type as keyof typeof types] || type;
  };

  const getLicenseStatusBadge = (license: LicenseHistoryItem) => {
    const now = new Date();
    const endDate = new Date(license.end_date);
    
    if (!license.is_active) {
      return <Badge variant="secondary">غير نشط</Badge>;
    }
    
    if (endDate < now) {
      return <Badge variant="destructive">منتهي الصلاحية</Badge>;
    }
    
    return <Badge variant="default">نشط</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل التراخيص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>جاري تحميل السجل...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل التراخيص
          </CardTitle>
          <Button onClick={loadHistory} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد سجل تراخيص متاح</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((license) => (
                <div 
                  key={license.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">
                          {getLicenseTypeLabel(license.license_type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          مدة الترخيص: {license.license_duration} يوم
                        </p>
                      </div>
                    </div>
                    {getLicenseStatusBadge(license)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">تاريخ البداية</p>
                        <p>{formatDate(license.start_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">تاريخ الانتهاء</p>
                        <p>{formatDate(license.end_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {license.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-muted-foreground">الحالة</p>
                        <p>{license.is_active ? 'نشط' : 'غير نشط'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}