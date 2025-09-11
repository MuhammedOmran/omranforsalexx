import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supplierIntegrationManager } from '@/utils/supplierIntegrationManager';
import { formatCurrency } from '@/lib/utils';
import { Truck, TrendingUp, Receipt, Calendar, Star } from 'lucide-react';

interface SupplierFinancialProfileProps {
  supplierId: string;
}

export function SupplierFinancialProfile({ supplierId }: SupplierFinancialProfileProps) {
  const [supplierData, setSupplierData] = React.useState<any>(null);
  const [priceAnalysis, setPriceAnalysis] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSupplierData = () => {
      try {
        const data = supplierIntegrationManager.getSupplierIntegratedData(supplierId);
        const analysis = supplierIntegrationManager.analyzeSupplierPricing(supplierId);
        setSupplierData(data);
        setPriceAnalysis(analysis);
      } catch (error) {
        console.error('Error fetching supplier data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [supplierId]);

  if (loading) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  if (!supplierData) {
    return <div className="p-4">لم يتم العثور على بيانات المورد</div>;
  }

  const getPerformanceBadgeColor = (performance: string) => {
    switch (performance) {
      case 'ممتاز': return 'bg-emerald-100 text-emerald-800';
      case 'جيد': return 'bg-blue-100 text-blue-800';
      case 'متوسط': return 'bg-amber-100 text-amber-800';
      case 'ضعيف': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReliabilityBadgeColor = (reliability: string) => {
    switch (reliability) {
      case 'عالية': return 'bg-emerald-100 text-emerald-800';
      case 'متوسطة': return 'bg-amber-100 text-amber-800';
      case 'منخفضة': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Supplier Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            الملف المالي للمورد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">إجمالي المشتريات</div>
              <div className="text-2xl font-bold">{formatCurrency(supplierData.totalSpent)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">عدد الطلبات</div>
              <div className="text-2xl font-bold">{supplierData.totalOrders}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">متوسط الطلب</div>
              <div className="text-2xl font-bold">{formatCurrency(supplierData.averageOrderValue)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">المديونية</div>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(supplierData.totalDebt)}</div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge className={getPerformanceBadgeColor(supplierData.performance)}>
              الأداء: {supplierData.performance}
            </Badge>
            <Badge className={getReliabilityBadgeColor(supplierData.reliability)}>
              الموثوقية: {supplierData.reliability}
            </Badge>
            <Badge variant="outline">
              التنافسية: {supplierData.priceCompetitiveness}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">مؤشرات الأداء</TabsTrigger>
          <TabsTrigger value="pricing">تحليل الأسعار</TabsTrigger>
          <TabsTrigger value="delivery">التسليم والجودة</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                مؤشرات الأداء العامة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary">{supplierData.totalOrders}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600">{formatCurrency(supplierData.totalSpent)}</div>
                  <div className="text-sm text-muted-foreground">إجمالي المشتريات</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{formatCurrency(supplierData.averageOrderValue)}</div>
                  <div className="text-sm text-muted-foreground">متوسط قيمة الطلب</div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">تقييم الأداء العام</span>
                  <Badge className={getPerformanceBadgeColor(supplierData.performance)}>
                    {supplierData.performance}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">مستوى الموثوقية</span>
                  <Badge className={getReliabilityBadgeColor(supplierData.reliability)}>
                    {supplierData.reliability}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">آخر عملية شراء</span>
                  <span className="text-sm text-muted-foreground">
                    {supplierData.lastPurchaseDate ? 
                      new Date(supplierData.lastPurchaseDate).toLocaleDateString('ar-EG') : 
                      'لا توجد عمليات'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Analysis Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                تحليل الأسعار والتنافسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">#{priceAnalysis?.priceRank || 0}</div>
                    <div className="text-sm text-muted-foreground">
                      الترتيب من أصل {priceAnalysis?.totalSuppliers || 0} مورد
                    </div>
                  </div>
                  
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(priceAnalysis?.averagePrice || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">متوسط سعر الطلب</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">تقييم التنافسية</h4>
                    <p className="text-sm text-muted-foreground">
                      {priceAnalysis?.competitiveAdvantage || 'غير محدد'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">مؤشر الأسعار</h4>
                    <Badge variant="outline" className="text-lg">
                      {supplierData.priceCompetitiveness}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery & Quality Tab */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                التسليم والجودة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{supplierData.onTimeDeliveryRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">معدل التسليم في الوقت</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-amber-600">{supplierData.avgDeliveryDays}</div>
                  <div className="text-sm text-muted-foreground">متوسط أيام التسليم</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <span className="text-3xl font-bold text-yellow-600">{supplierData.qualityRating.toFixed(1)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">تقييم الجودة (من 5)</div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">تقييم التسليم</h4>
                  <div className="flex justify-between items-center">
                    <span>معدل التسليم في الوقت المحدد</span>
                    <span className="font-bold">{supplierData.onTimeDeliveryRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${supplierData.onTimeDeliveryRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">تقييم الجودة</h4>
                  <div className="flex justify-between items-center">
                    <span>متوسط تقييم الجودة</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= supplierData.qualityRating 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-bold">{supplierData.qualityRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}