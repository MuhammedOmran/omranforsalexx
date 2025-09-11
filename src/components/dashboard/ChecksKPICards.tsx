import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, TrendingUp, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { formatNumberEnglish, formatCurrencyEnglish } from '@/utils/numberLocalization';
import { cn } from "@/lib/utils";

interface CheckStats {
  total: number;
  pending: number;
  cashed: number;
  paid: number;
  bounced: number;
  overdue: number;
  dueSoon: number;
  totalPendingAmount: number;
  totalCashedAmount: number;
  totalPaidAmount: number;
}

export function ChecksKPICards() {
  const [checkStats, setCheckStats] = useState<CheckStats>({
    total: 0,
    pending: 0,
    cashed: 0,
    paid: 0,
    bounced: 0,
    overdue: 0,
    dueSoon: 0,
    totalPendingAmount: 0,
    totalCashedAmount: 0,
    totalPaidAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckStats();
    
    // تحديث الإحصائيات كل دقيقة
    const interval = setInterval(loadCheckStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCheckStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'ChecksKPICards');
        return;
      }

      // جلب جميع الشيكات للمستخدم الحالي
      const { data: checks, error } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (error) throw error;

      if (!checks) {
        setCheckStats({
          total: 0,
          pending: 0,
          cashed: 0,
          paid: 0,
          bounced: 0,
          overdue: 0,
          dueSoon: 0,
          totalPendingAmount: 0,
          totalCashedAmount: 0,
          totalPaidAmount: 0,
        });
        return;
      }

      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const pendingChecks = checks.filter(check => check.status === 'pending');
      const cashedChecks = checks.filter(check => check.status === 'cashed');
      const paidChecks = checks.filter(check => check.status === 'paid');
      const bouncedChecks = checks.filter(check => check.status === 'bounced');
      
      // الشيكات المتأخرة (معلقة وتجاوزت تاريخ الاستحقاق)
      const overdueChecks = pendingChecks.filter(check => 
        new Date(check.due_date) < today
      );
      
      // الشيكات المستحقة قريباً (خلال أسبوع)
      const dueSoonChecks = pendingChecks.filter(check => {
        const dueDate = new Date(check.due_date);
        return dueDate >= today && dueDate <= weekFromNow;
      });

      const totalPendingAmount = pendingChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
      const totalCashedAmount = cashedChecks.reduce((sum, check) => sum + (check.amount || 0), 0);
      const totalPaidAmount = paidChecks.reduce((sum, check) => sum + (check.amount || 0), 0);

      setCheckStats({
        total: checks.length,
        pending: pendingChecks.length,
        cashed: cashedChecks.length,
        paid: paidChecks.length,
        bounced: bouncedChecks.length,
        overdue: overdueChecks.length,
        dueSoon: dueSoonChecks.length,
        totalPendingAmount,
        totalCashedAmount,
        totalPaidAmount,
      });
    } catch (error) {
      logger.error('خطأ في تحميل إحصائيات الشيكات من Supabase:', error, 'ChecksKPICards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* إجمالي الشيكات */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الشيكات</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumberEnglish(checkStats.total)}</div>
          <p className="text-xs text-muted-foreground">
            جميع الشيكات المستلمة
          </p>
        </CardContent>
      </Card>

      {/* الشيكات المعلقة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الشيكات المعلقة</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{formatNumberEnglish(checkStats.pending)}</div>
          <p className="text-xs text-muted-foreground">
            قيمة {formatCurrencyEnglish(checkStats.totalPendingAmount, "ج.م")}
          </p>
          {checkStats.overdue > 0 && (
            <Badge variant="destructive" className="mt-2 text-xs">
              {formatNumberEnglish(checkStats.overdue)} متأخر
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* الشيكات المحصلة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الشيكات المحصلة</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatNumberEnglish(checkStats.cashed)}</div>
          <p className="text-xs text-muted-foreground">
            قيمة {formatCurrencyEnglish(checkStats.totalCashedAmount, "ج.م")}
          </p>
          {checkStats.total > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                معدل التحصيل: {formatNumberEnglish(Math.round((checkStats.cashed / checkStats.total) * 100))}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الشيكات المدفوعة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الشيكات المدفوعة</CardTitle>
          <TrendingUp className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatNumberEnglish(checkStats.paid)}</div>
          <p className="text-xs text-muted-foreground">
            إجمالي المبلغ: {formatCurrencyEnglish(checkStats.totalPaidAmount, "ج.م")}
          </p>
          {checkStats.total > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                معدل الدفع: {formatNumberEnglish(Math.round((checkStats.paid / checkStats.total) * 100))}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الشيكات المرتدة والتنبيهات */}
      <Card className={cn(
        checkStats.bounced > 0 || checkStats.dueSoon > 0 ? "border-red-200 bg-red-50" : ""
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">شيكات هامة</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checkStats.bounced > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">شيكات مرتدة</span>
                <Badge variant="destructive">{formatNumberEnglish(checkStats.bounced)}</Badge>
              </div>
            )}
            {checkStats.dueSoon > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">مستحقة قريباً</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {formatNumberEnglish(checkStats.dueSoon)}
                </Badge>
              </div>
            )}
            {checkStats.bounced === 0 && checkStats.dueSoon === 0 && (
              <div className="text-center py-2">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-600">لا توجد شيكات</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}