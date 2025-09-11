import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, DollarSign, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useNavigate } from "react-router-dom";
import { formatNumberEnglish, formatCurrencyEnglish } from '@/utils/numberLocalization';

interface Transaction {
  id: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  status: 'paid' | 'unpaid';
  created_at: string;
  items_count: number;
}

export function SupabaseRecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentTransactions();
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(loadRecentTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'SupabaseRecentTransactions');
        return;
      }

      // جلب آخر 10 فواتير مع بيانات العملاء وعدد العناصر
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customers (
            name,
            phone
          ),
          invoice_items (
            id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedTransactions: Transaction[] = (invoices || []).map(invoice => ({
        id: invoice.id,
        customer_name: invoice.customers?.name || 'عميل غير محدد',
        customer_phone: invoice.customers?.phone,
        total_amount: invoice.total_amount,
        status: invoice.status as 'paid' | 'unpaid',
        created_at: invoice.created_at,
        items_count: invoice.invoice_items?.length || 0
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      logger.error('خطأ في تحميل المعاملات الحديثة من Supabase', error, 'SupabaseRecentTransactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInMinutes < 1440) {
      return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    } else {
      return date.toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        numberingSystem: 'latn'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'unpaid':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'unpaid':
        return 'غير مدفوعة';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المعاملات الحديثة</CardTitle>
          <CardDescription>آخر المعاملات والفواتير</CardDescription>
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
                <div className="w-16 h-6 bg-muted rounded"></div>
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
              المعاملات الحديثة (مباشرة)
            </CardTitle>
            <CardDescription>
              آخر {transactions.length} معاملة من قاعدة البيانات
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/sales/invoices')}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            عرض الكل
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد معاملات حديثة</p>
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={() => navigate('/sales/new')}
            >
              إنشاء فاتورة جديدة
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/sales/invoices?id=${transaction.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {transaction.customer_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(transaction.created_at)}
                      {transaction.items_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{transaction.items_count} عنصر</span>
                        </>
                      )}
                    </div>
                    {transaction.customer_phone && (
                      <p className="text-xs text-muted-foreground truncate">
                        {transaction.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {formatCurrencyEnglish(transaction.total_amount, "ج.م")}
                    </p>
                    <Badge 
                      className={`text-xs ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusText(transaction.status)}
                    </Badge>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}

        {transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>
              إجمالي المعاملات: {formatCurrencyEnglish(transactions.reduce((sum, t) => sum + t.total_amount, 0), "ج.م")}
            </span>
            <span>
              المدفوع: {formatNumberEnglish(transactions.filter(t => t.status === 'paid').length)} | 
              المعلق: {formatNumberEnglish(transactions.filter(t => t.status === 'unpaid').length)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}