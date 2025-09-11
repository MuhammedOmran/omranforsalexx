import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, DollarSign, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SupplierStatsProps {
  suppliers: any[];
  className?: string;
}

export function SupplierStats({ suppliers, className }: SupplierStatsProps) {
  // التأكد من أن suppliers هو array
  const suppliersArray = Array.isArray(suppliers) ? suppliers : [];
  
  console.log('SupplierStats suppliers:', suppliers, 'isArray:', Array.isArray(suppliers));
  
  const activeSuppliers = suppliersArray.filter(s => s.status === 'active').length;
  const totalPurchases = suppliersArray.reduce((sum, supplier) => sum + (supplier.totalPurchases || 0), 0);
  const averageRating = suppliersArray.length > 0 
    ? suppliersArray.reduce((sum, supplier) => sum + (supplier.rating || 0), 0) / suppliersArray.length 
    : 0;

  const suppliersWithDebt = suppliersArray.filter(s => (s.totalDebt || 0) > 0).length;
  const topPerformers = suppliersArray.filter(s => (s.rating || 0) >= 4).length;
  const riskSuppliers = suppliersArray.filter(s => s.riskLevel === 'high').length;

  const stats = [
    {
      title: 'إجمالي الموردين',
      value: suppliersArray.length,
      icon: Users,
      description: 'العدد الكلي للموردين',
      color: 'text-blue-600'
    },
    {
      title: 'الموردين النشطين',
      value: activeSuppliers,
      icon: CheckCircle,
      description: `${((activeSuppliers / Math.max(suppliersArray.length, 1)) * 100).toFixed(1)}% من الإجمالي`,
      color: 'text-emerald-600'
    },
    {
      title: 'إجمالي المشتريات',
      value: formatCurrency(totalPurchases),
      icon: DollarSign,
      description: 'القيمة الإجمالية للمشتريات',
      color: 'text-purple-600'
    },
    {
      title: 'متوسط التقييم',
      value: `${averageRating.toFixed(1)} ⭐`,
      icon: Building,
      description: 'تقييم الأداء العام',
      color: 'text-amber-600'
    },
    {
      title: 'الأداء المتميز',
      value: topPerformers,
      icon: TrendingUp,
      description: 'موردين بتقييم 4+ نجوم',
      color: 'text-green-600'
    },
    {
      title: 'تنبيهات المخاطر',
      value: riskSuppliers + suppliersWithDebt,
      icon: AlertTriangle,
      description: 'موردين يحتاجون متابعة',
      color: 'text-red-600'
    }
  ];

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}