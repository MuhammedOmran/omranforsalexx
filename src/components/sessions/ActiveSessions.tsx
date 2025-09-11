import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  LogOut,
  Search,
  MapPin,
  Shield,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";
import { formatNumberEnglish } from '@/utils/numberLocalization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Session {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  location: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  risk_score: number;
}

interface ActiveSessionsProps {
  onRefresh: () => void;
}

export function ActiveSessions({ onRefresh }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [terminating, setTerminating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveSessions();
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(loadActiveSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'ActiveSessions');
        return;
      }

      // جلب الجلسات النشطة - سنستخدم بيانات تجريبية حتى يتم إنشاء جدول user_sessions
      const mockSessions: Session[] = [
        {
          id: '1',
          user_id: user.id,
          session_token: 'current-session',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          device_type: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          location: 'القاهرة, مصر',
          is_active: true,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          risk_score: 0
        },
        {
          id: '2',
          user_id: user.id,
          session_token: 'mobile-session',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          device_type: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          location: 'الإسكندرية, مصر',
          is_active: true,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          risk_score: 25
        }
      ];

      setSessions(mockSessions);
    } catch (error) {
      logger.error('خطأ في تحميل الجلسات النشطة:', error, 'ActiveSessions');
      toast({
        title: "خطأ",
        description: "فشل في تحميل الجلسات النشطة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setTerminating(sessionId);
      
      // في التطبيق الحقيقي، سيتم إنهاء الجلسة من قاعدة البيانات
      // await supabase.from('user_sessions').update({ is_active: false }).eq('id', sessionId);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "تم إنهاء الجلسة",
        description: "تم إنهاء الجلسة بنجاح"
      });
      
      onRefresh();
    } catch (error) {
      logger.error('خطأ في إنهاء الجلسة:', error, 'ActiveSessions');
      toast({
        title: "خطأ",
        description: "فشل في إنهاء الجلسة",
        variant: "destructive"
      });
    } finally {
      setTerminating(null);
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

  const getRiskBadge = (riskScore: number) => {
    if (riskScore === 0) {
      return <Badge className="bg-green-100 text-green-800">آمن</Badge>;
    } else if (riskScore < 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">متوسط</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">عالي</Badge>;
    }
  };

  const formatLastActivity = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${formatNumberEnglish(minutes)} دقيقة`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${formatNumberEnglish(hours)} ساعة`;
    
    const days = Math.floor(hours / 24);
    return `منذ ${formatNumberEnglish(days)} يوم`;
  };

  const filteredSessions = sessions.filter(session =>
    session.ip_address.includes(searchTerm) ||
    session.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.location.includes(searchTerm)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الجلسات النشطة</CardTitle>
          <CardDescription>جاري التحميل...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
              <Shield className="h-5 w-5 text-primary" />
              الجلسات النشطة ({formatNumberEnglish(sessions.length)})
            </CardTitle>
            <CardDescription>
              الجلسات الحالية المرتبطة بحسابك
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الجلسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-60"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">لا توجد جلسات نشطة</h3>
            <p>لم يتم العثور على جلسات تطابق البحث</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    {getDeviceIcon(session.device_type)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.browser} على {session.os}</span>
                      {session.session_token === 'current-session' && (
                        <Badge variant="secondary" className="text-xs">الجلسة الحالية</Badge>
                      )}
                      {getRiskBadge(session.risk_score)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                        {formatLastActivity(session.last_activity)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {session.risk_score > 50 && (
                    <Button variant="outline" size="sm" className="text-yellow-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      مراجعة
                    </Button>
                  )}
                  
                  {session.session_token !== 'current-session' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          إنهاء
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تأكيد إنهاء الجلسة</DialogTitle>
                          <DialogDescription>
                            هل أنت متأكد من إنهاء هذه الجلسة؟ سيتم تسجيل خروج المستخدم من هذا الجهاز.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm"><strong>الجهاز:</strong> {session.browser} على {session.os}</p>
                            <p className="text-sm"><strong>الموقع:</strong> {session.location}</p>
                            <p className="text-sm"><strong>عنوان IP:</strong> {session.ip_address}</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => terminateSession(session.id)}
                            disabled={terminating === session.id}
                          >
                            {terminating === session.id ? 'جاري الإنهاء...' : 'إنهاء الجلسة'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}