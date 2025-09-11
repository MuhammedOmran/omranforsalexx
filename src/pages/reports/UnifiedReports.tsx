import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Download, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { unifiedReportsManager } from '@/utils/unifiedReportsManager';
import { SmartAlerts } from '@/components/dashboard/SmartAlerts';
import { format } from 'date-fns';

export default function UnifiedReports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [reports, setReports] = useState<any>({
    profit: null,
    cashFlow: null,
    performance: null,
    integration: null,
    risks: null
  });

  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const profitReport = unifiedReportsManager.getComprehensiveProfitReport(
        dateRange.startDate, 
        dateRange.endDate
      );
      const cashFlowReport = unifiedReportsManager.getUnifiedCashFlowReport(
        dateRange.startDate, 
        dateRange.endDate
      );
      const performanceReport = unifiedReportsManager.getIntegratedPerformanceReport();
      const integrationReport = unifiedReportsManager.getSystemIntegrationReport(
        dateRange.startDate, 
        dateRange.endDate
      );
      const risksReport = unifiedReportsManager.getRisksAndAlertsReport();

      setReports({
        profit: profitReport,
        cashFlow: cashFlowReport,
        performance: performanceReport,
        integration: integrationReport,
        risks: risksReport
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">التقارير الموحدة</h1>
          <p className="text-muted-foreground">
            تحليل شامل ومترابط لجميع أنظمة الإدارة
          </p>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <Button onClick={loadReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="financial">التحليل المالي</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {reports.profit && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-green-600">إجمالي المبيعات</h3>
                  <p className="text-2xl font-bold">
                    {reports.profit.revenue?.totalSales?.toLocaleString()} جنيه
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-red-600">إجمالي التكاليف</h3>
                  <p className="text-2xl font-bold">
                    {reports.profit.costs?.totalCosts?.toLocaleString()} جنيه
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-blue-600">صافي الربح</h3>
                  <p className={`text-2xl font-bold ${
                    reports.profit.profitability?.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {reports.profit.profitability?.netProfit?.toLocaleString()} جنيه
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {reports.cashFlow && (
            <Card>
              <CardHeader>
                <CardTitle>التدفق النقدي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>إجمالي الداخل:</span>
                    <span className="font-bold text-green-600">
                      {reports.cashFlow.transactions?.totalIncome?.toLocaleString()} جنيه
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي الخارج:</span>
                    <span className="font-bold text-red-600">
                      {reports.cashFlow.transactions?.totalExpense?.toLocaleString()} جنيه
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>صافي التدفق:</span>
                    <span className={`font-bold ${
                      reports.cashFlow.transactions?.netFlow > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {reports.cashFlow.transactions?.netFlow?.toLocaleString()} جنيه
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <SmartAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}