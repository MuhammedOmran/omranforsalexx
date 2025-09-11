import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Edit, Trash2, Phone, Mail, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  center: string;
  country: string;
  category: string;
  rating: number;
  totalPurchases: number;
  status: 'active' | 'inactive' | 'pending';
  paymentTerms: string;
  notes?: string;
  joinDate: Date;
  riskLevel?: 'low' | 'medium' | 'high';
  totalDebt?: number;
  lastPurchaseDate?: string;
}

interface SuppliersListProps {
  suppliers: Supplier[];
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function SuppliersList({
  suppliers,
  onView,
  onEdit,
  onDelete,
  isLoading = false
}: SuppliersListProps) {
  
  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline"
    };
    
    const labels = {
      active: "نشط",
      inactive: "غير نشط",
      pending: "معلق"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const variants = {
      low: "default",
      medium: "outline", 
      high: "destructive"
    };
    
    const labels = {
      low: "منخفض",
      medium: "متوسط",
      high: "مرتفع"
    };

    return (
      <Badge 
        variant={variants[riskLevel as keyof typeof variants] as any}
        className="ml-2"
      >
        {labels[riskLevel as keyof typeof labels]}
      </Badge>
    );
  };

  const getRatingDisplay = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-yellow-500">⭐</span>
      </div>
    );
  };

  const getPerformanceIndicator = (supplier: Supplier) => {
    const hasDebt = (supplier.totalDebt || 0) > 0;
    const isHighRisk = supplier.riskLevel === 'high';
    const lowRating = supplier.rating < 3;
    
    if (isHighRisk || hasDebt || lowRating) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">يحتاج متابعة</span>
        </div>
      );
    }
    
    if (supplier.rating >= 4) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs">أداء متميز</span>
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-2 font-cairo">لا توجد موردين</div>
        <div className="text-sm text-muted-foreground font-cairo">
          لم يتم العثور على موردين مطابقين للبحث
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-cairo">المورد</TableHead>
            <TableHead className="font-cairo">جهة الاتصال</TableHead>
            <TableHead className="font-cairo">التصنيف</TableHead>
            <TableHead className="font-cairo">الموقع</TableHead>
            <TableHead className="font-cairo">المشتريات</TableHead>
            <TableHead className="font-cairo">التقييم</TableHead>
            <TableHead className="font-cairo">الحالة</TableHead>
            <TableHead className="font-cairo">الأداء</TableHead>
            <TableHead className="font-cairo">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {supplier.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-base">{supplier.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {supplier.email || 'لا يوجد بريد'}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-sm">{supplier.contactPerson}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {supplier.phone}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className="font-cairo">
                  {supplier.category || 'غير محدد'}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {supplier.city}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {supplier.country}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">
                    {formatCurrency(supplier.totalPurchases)}
                  </div>
                  {supplier.lastPurchaseDate && (
                    <div className="text-xs text-muted-foreground">
                      آخر شراء: {new Date(supplier.lastPurchaseDate).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {getRatingDisplay(supplier.rating)}
                  {getRiskBadge(supplier.riskLevel)}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {getStatusBadge(supplier.status)}
                  {(supplier.totalDebt || 0) > 0 && (
                    <div className="text-xs text-red-600">
                      مديونية: {formatCurrency(supplier.totalDebt || 0)}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {getPerformanceIndicator(supplier)}
              </TableCell>
              
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(supplier)}
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(supplier)}
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(supplier.id)}
                    className="text-red-600 hover:text-red-700"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}