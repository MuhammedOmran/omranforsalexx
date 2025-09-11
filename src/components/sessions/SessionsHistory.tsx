import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe,
  Search,
  MapPin,
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";
import { formatNumberEnglish } from '@/utils/numberLocalization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistorySession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  location: string;
  created_at: string;
  ended_at: string;
  duration_minutes: number;
  end_reason: 'logout' | 'timeout' | 'terminated' | 'expired';
  risk_score: number;
}

export function SessionsHistory() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [filterReason, setFilterReason] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadSessionsHistory();
  }, []);

  const loadSessionsHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'SessionsHistory');
        return;
      }

      // بيانات تجريبية للتاريخ
      const mockHistory: HistorySession[] = [
        {
          id: '1',
          user_id: user.id,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          device_type: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          location: 'القاهرة, مصر',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 120,
          end_reason: 'logout',
          risk_score: 0
        },
        {
          id: '2',
          user_id: user.id,
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          device_type: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          location: 'الإسكندرية, مصر',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 45,
          end_reason: 'timeout',
          risk_score: 15
        },
        {
          id: '3',
          user_id: user.id,
          ip_address: '203.0.113.1',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          device_type: 'desktop',
          browser: 'Firefox',
          os: 'Linux',
          location: 'الرياض, السعودية',
          created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          ended_at: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 30,
          end_reason: 'terminated',
          risk_score: 75
        }
      ];

      setSessions(mockHistory);
    } catch (error) {
      logger.error('خطأ في تحميل تاريخ الجلسات:', error, 'SessionsHistory');
      toast({
        title: "خطأ",
        description: "فشل في تحميل تاريخ الجلسات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getEndReasonBadge = (reason: string) => {
    switch (reason) {
      case 'logout':
        return <Badge className="bg-green-100 text-green-800">تسجيل خروج</Badge>;
      case 'timeout':
        return <Badge className="bg-yellow-100 text-yellow-800">انتهت المهلة</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">تم إنهاؤها</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">انتهت الصلاحية</Badge>;
      default:
        return <Badge variant="secondary">{reason}</Badge>;
    }
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore === 0) {
      return <Badge className="bg-green-100 text-green-800">آمن</Badge>;
    } else if (riskScore < 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">متوسط</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">عالي</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${formatNumberEnglish(minutes)} دقيقة`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${formatNumberEnglish(hours)} ساعة${remainingMinutes > 0 ? ` و ${formatNumberEnglish(remainingMinutes)} دقيقة` : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn'
    });
  };

  const exportHistory = () => {
    const csvContent = [
      ['التاريخ', 'الجهاز', 'المتصفح', 'نظام التشغيل', 'الموقع', 'عنوان IP', 'المدة', 'سبب الإنهاء', 'مستوى الخطر'].join(','),
      ...filteredSessions.map(session => [
        formatDate(session.created_at),
        session.device_type,
        session.browser,
        session.os,
        session.location,
        session.ip_address,
        formatDuration(session.duration_minutes),
        session.end_reason,
        session.risk_score
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sessions-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم التصدير",
      description: "تم تصدير تاريخ الجلسات بنجاح"
    });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.ip_address.includes(searchTerm) ||
      session.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.location.includes(searchTerm);
    
    const matchesDevice = filterDevice === 'all' || session.device_type === filterDevice;
    const matchesReason = filterReason === 'all' || session.end_reason === filterReason;
    
    return matchesSearch && matchesDevice && matchesReason;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تاريخ الجلسات</CardTitle>
          <CardDescription>جاري التحميل...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 space-x-reverse animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              تاريخ الجلسات ({formatNumberEnglish(sessions.length)})
            </CardTitle>
            <CardDescription>
              سجل الجلسات السابقة وتفاصيل الوصول
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            onClick={exportHistory}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في تاريخ الجلسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterDevice} onValueChange={setFilterDevice}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="نوع الجهاز" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأجهزة</SelectItem>
              <SelectItem value="desktop">سطح المكتب</SelectItem>
              <SelectItem value="mobile">الهاتف</SelectItem>
              <SelectItem value="tablet">الجهاز اللوحي</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="سبب الإنهاء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأسباب</SelectItem>
              <SelectItem value="logout">تسجيل خروج</SelectItem>
              <SelectItem value="timeout">انتهت المهلة</SelectItem>
              <SelectItem value="terminated">تم إنهاؤها</SelectItem>
              <SelectItem value="expired">انتهت الصلاحية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">لا توجد جلسات</h3>
            <p>لم يتم العثور على جلسات تطابق البحث والفلاتر</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-full">
                    {getDeviceIcon(session.device_type)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.browser} على {session.os}</span>
                      {getRiskBadge(session.risk_score)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {session.ip_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(session.duration_minutes)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {getEndReasonBadge(session.end_reason)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}