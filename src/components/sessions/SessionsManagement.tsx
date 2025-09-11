import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  Users, 
  Activity,
  LogOut,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";
import { formatNumberEnglish } from '@/utils/numberLocalization';
import { ActiveSessions } from './ActiveSessions';
import { SessionsHistory } from './SessionsHistory';
import { SessionsStats } from './SessionsStats';
import { SessionsAlerts } from './SessionsAlerts';

export function SessionsManagement() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // سيتم تحميل البيانات من المكونات الفرعية
    } catch (error) {
      logger.error('خطأ في تحميل بيانات الجلسات:', error, 'SessionsManagement');
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الجلسات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
    toast({
      title: "تم التحديث",
      description: "تم تحديث بيانات الجلسات بنجاح"
    });
  };

  const handleCleanupExpiredSessions = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');
      
      if (error) throw error;

      toast({
        title: "تم التنظيف",
        description: `تم تنظيف ${formatNumberEnglish(data || 0)} جلسة منتهية الصلاحية`
      });
      
      handleRefresh();
    } catch (error) {
      logger.error('خطأ في تنظيف الجلسات المنتهية:', error, 'SessionsManagement');
      toast({
        title: "خطأ",
        description: "فشل في تنظيف الجلسات المنتهية",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mada-heading text-foreground">إدارة الجلسات</h1>
            <p className="text-muted-foreground mt-1">
              إدارة ومراقبة جلسات المستخدمين النشطة والسابقة
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mada-heading text-foreground">إدارة الجلسات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة ومراقبة جلسات المستخدمين النشطة والسابقة مع إحصائيات مفصلة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button
            variant="outline"
            onClick={handleCleanupExpiredSessions}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            تنظيف الجلسات المنتهية
          </Button>
        </div>
      </div>

      {/* Sessions Management */}
      <SessionsStats />

      {/* Alert Section */}
      <SessionsAlerts />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            الجلسات النشطة
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            تاريخ الجلسات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <ActiveSessions onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <SessionsHistory />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                تحليلات الجلسات المتقدمة
              </CardTitle>
              <CardDescription>
                إحصائيات مفصلة حول استخدام الجلسات وأنماط الوصول
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">قريباً</h3>
                <p>ستتوفر تحليلات متقدمة للجلسات قريباً</p>
                <p className="text-sm mt-1">تتضمن رسوم بيانية للاستخدام اليومي والأسبوعي</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}