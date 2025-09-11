import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bug, 
  Database, 
  Network, 
  FileText, 
  Monitor, 
  Settings, 
  Code, 
  Terminal,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  Activity,
  Cpu,
  HardDrive,
  Wifi
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "@/hooks/use-toast";

interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  memory?: any;
  connection?: any;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

export function DeveloperTools() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { getCategorySettings } = useAppSettings();

  useEffect(() => {
    checkDeveloperMode();
    collectSystemInfo();
    setupConsoleInterception();
  }, []);

  const checkDeveloperMode = async () => {
    try {
      const advancedSettings = await getCategorySettings('advanced');
      const debugMode = advancedSettings.debugMode || (window as any).debugMode;
      setIsVisible(debugMode);
    } catch (error) {
      console.error('فشل في فحص وضع المطور:', error);
    }
  };

  const collectSystemInfo = () => {
    const info: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };

    // معلومات الذاكرة إذا كانت متاحة
    if ('memory' in performance) {
      info.memory = (performance as any).memory;
    }

    // معلومات الاتصال إذا كانت متاحة
    if ('connection' in navigator) {
      info.connection = (navigator as any).connection;
    }

    setSystemInfo(info);
  };

  const setupConsoleInterception = () => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      addLog('info', args.join(' '), args);
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      addLog('warn', args.join(' '), args);
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      addLog('error', args.join(' '), args);
      originalError.apply(console, args);
    };
  };

  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    setLogs(prev => {
      const newLogs = [logEntry, ...prev];
      return newLogs.slice(0, 100); // الاحتفاظ بآخر 100 سجل فقط
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      logs
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `developer-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم تصدير السجلات",
      description: "تم تنزيل ملف السجلات للمطورين",
    });
  };

  const runDiagnostics = () => {
    const diagnostics = {
      localStorage: localStorage.length,
      sessionStorage: sessionStorage.length,
      performance: performance.now(),
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };

    addLog('info', 'تشغيل التشخيصات', diagnostics);
    
    toast({
      title: "تم تشغيل التشخيصات",
      description: "تم إضافة نتائج التشخيص إلى السجلات",
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bug className="h-4 w-4" />
            أدوات المطور
          </CardTitle>
          <CardDescription className="text-xs">
            أدوات التشخيص والتطوير المتقدمة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <Tabs defaultValue="console" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="console">
                <Terminal className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="system">
                <Monitor className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="network">
                <Network className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Settings className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="mt-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">
                    {logs.length} سجلات
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={clearLogs}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportLogs}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="h-40 overflow-y-auto bg-muted/50 p-2 rounded text-xs space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">لا توجد سجلات</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Badge variant={getLevelColor(log.level)} className="text-xs px-1 py-0">
                          {log.level}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs">{log.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="mt-3">
              <div className="space-y-2 text-xs">
                {systemInfo && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-medium">المنصة:</p>
                        <p className="text-muted-foreground truncate">{systemInfo.platform}</p>
                      </div>
                      <div>
                        <p className="font-medium">اللغة:</p>
                        <p className="text-muted-foreground">{systemInfo.language}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3 w-3" />
                      <Badge variant={systemInfo.onLine ? 'default' : 'destructive'}>
                        {systemInfo.onLine ? 'متصل' : 'غير متصل'}
                      </Badge>
                    </div>

                    {systemInfo.memory && (
                      <div className="space-y-1">
                        <p className="font-medium flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          الذاكرة:
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>المستخدمة: {Math.round(systemInfo.memory.usedJSHeapSize / 1024 / 1024)}MB</div>
                          <div>الحد الأقصى: {Math.round(systemInfo.memory.totalJSHeapSize / 1024 / 1024)}MB</div>
                        </div>
                      </div>
                    )}

                    {systemInfo.connection && (
                      <div className="space-y-1">
                        <p className="font-medium">الاتصال:</p>
                        <p className="text-muted-foreground">
                          {systemInfo.connection.effectiveType} - {systemInfo.connection.downlink}Mbps
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="network" className="mt-3">
              <div className="space-y-2 text-xs">
                <p className="text-muted-foreground">مراقب الشبكة سيتم تطويره قريباً</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                  addLog('info', 'فحص الاتصالات الشبكة', { 
                    url: window.location.href,
                    timestamp: Date.now()
                  });
                }}>
                  <Activity className="h-3 w-3 mr-1" />
                  فحص الاتصالات
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="mt-3">
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full" onClick={runDiagnostics}>
                  <Cpu className="h-3 w-3 mr-1" />
                  تشغيل التشخيصات
                </Button>
                
                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                  window.location.reload();
                }}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  إعادة تحميل الصفحة
                </Button>
                
                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                  addLog('info', 'معلومات الصفحة الحالية', {
                    url: window.location.href,
                    title: document.title,
                    referrer: document.referrer
                  });
                }}>
                  <Eye className="h-3 w-3 mr-1" />
                  معلومات الصفحة
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}