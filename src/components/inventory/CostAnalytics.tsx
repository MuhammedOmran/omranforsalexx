import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calculator,
  Settings,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle
} from "lucide-react";
import {
  costTrackingManager,
  CostCenter,
  ProductCost,
  CostAnalysis,
  CostReport
} from "@/utils/costTrackingManager";

export function CostAnalytics() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCost[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [costReports, setCostReports] = useState<CostReport[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [isCreateCenterOpen, setIsCreateCenterOpen] = useState(false);
  const [isEditCenterOpen, setIsEditCenterOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isCalculating, setIsCalculating] = useState(false);

  const [centerForm, setCenterForm] = useState({
    name: '',
    description: '',
    category: 'production' as 'production' | 'sales' | 'admin' | 'hr' | 'marketing' | 'other'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setCostCenters(costTrackingManager.getCostCenters());
    setProductCosts(costTrackingManager.getProductCosts());
    setCostReports(costTrackingManager.getCostReports());
    
    // Generate current period analysis
    try {
      const analysis = costTrackingManager.generateCostAnalysis(startDate, endDate);
      setCostAnalysis(analysis);
    } catch (error) {
      console.error('Error loading cost analysis:', error);
    }
  };

  const resetCenterForm = () => {
    setCenterForm({
      name: '',
      description: '',
      category: 'production'
    });
  };

  const handleCreateCostCenter = () => {
    if (!centerForm.name.trim()) {
      toast.error('يرجى إدخال اسم مركز التكلفة');
      return;
    }

    const success = costTrackingManager.createCostCenter({
      name: centerForm.name,
      description: centerForm.description,
      category: centerForm.category,
      isActive: true
    });

    if (success) {
      toast.success('تم إنشاء مركز التكلفة بنجاح');
      setIsCreateCenterOpen(false);
      resetCenterForm();
      loadData();
    } else {
      toast.error('حدث خطأ أثناء إنشاء مركز التكلفة');
    }
  };

  const handleUpdateCostCenter = () => {
    if (!selectedCostCenter) return;

    const success = costTrackingManager.updateCostCenter(selectedCostCenter.id, {
      name: centerForm.name,
      description: centerForm.description,
      category: centerForm.category
    });

    if (success) {
      toast.success('تم تحديث مركز التكلفة بنجاح');
      setIsEditCenterOpen(false);
      setSelectedCostCenter(null);
      resetCenterForm();
      loadData();
    } else {
      toast.error('حدث خطأ أثناء تحديث مركز التكلفة');
    }
  };

  const handleDeleteCostCenter = (id: string) => {
    const success = costTrackingManager.deleteCostCenter(id);
    
    if (success) {
      toast.success('تم حذف مركز التكلفة بنجاح');
      loadData();
    } else {
      toast.error('حدث خطأ أثناء حذف مركز التكلفة');
    }
  };

  const openEditCenter = (center: CostCenter) => {
    setSelectedCostCenter(center);
    setCenterForm({
      name: center.name,
      description: center.description,
      category: center.category
    });
    setIsEditCenterOpen(true);
  };

  const calculateProductCosts = async () => {
    setIsCalculating(true);
    try {
      const costs = costTrackingManager.calculateProductCosts();
      setProductCosts(costs);
      toast.success('تم حساب تكاليف المنتجات بنجاح');
    } catch (error) {
      console.error('Error calculating product costs:', error);
      toast.error('حدث خطأ أثناء حساب تكاليف المنتجات');
    } finally {
      setIsCalculating(false);
    }
  };

  const allocateExpensesToCenters = () => {
    costTrackingManager.allocateExpensesToCostCenters();
    costTrackingManager.allocatePayrollToCostCenters();
    toast.success('تم توزيع التكاليف على مراكز التكلفة تلقائياً');
    loadData();
  };

  const generateCostReport = (type: 'product_costing' | 'cost_center' | 'profitability' | 'variance') => {
    try {
      const report = costTrackingManager.generateCostReport(type, startDate, endDate);
      loadData();
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      console.error('Error generating cost report:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    }
  };

  const updateAnalysis = () => {
    try {
      const analysis = costTrackingManager.generateCostAnalysis(startDate, endDate);
      setCostAnalysis(analysis);
      toast.success('تم تحديث التحليل بنجاح');
    } catch (error) {
      console.error('Error updating analysis:', error);
      toast.error('حدث خطأ أثناء تحديث التحليل');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      production: 'إنتاج',
      sales: 'مبيعات',
      admin: 'إداري',
      hr: 'موارد بشرية',
      marketing: 'تسويق',
      other: 'أخرى'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      production: 'bg-blue-100 text-blue-800',
      sales: 'bg-green-100 text-green-800',
      admin: 'bg-gray-100 text-gray-800',
      hr: 'bg-purple-100 text-purple-800',
      marketing: 'bg-orange-100 text-orange-800',
      other: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تحليلات التكاليف الشاملة</h1>
          <p className="text-muted-foreground mt-2">
            تتبع وتحليل التكاليف بجميع أنواعها ومراكز التكلفة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={allocateExpensesToCenters} variant="outline">
            <Target className="h-4 w-4 mr-2" />
            توزيع التكاليف تلقائياً
          </Button>
          <Button onClick={loadData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="centers">مراكز التكلفة</TabsTrigger>
          <TabsTrigger value="products">تكاليف المنتجات</TabsTrigger>
          <TabsTrigger value="analysis">تحليل التكاليف</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {costAnalysis && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">إجمالي التكاليف</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(costAnalysis.totalCosts)}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">التكاليف المتغيرة</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(costAnalysis.variableCosts)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">التكاليف الثابتة</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(costAnalysis.fixedCosts)}
                        </p>
                      </div>
                      <PieChart className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">الربح الإجمالي</p>
                        <p className={`text-2xl font-bold ${costAnalysis.profitabilityAnalysis.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(costAnalysis.profitabilityAnalysis.grossProfit)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>تحليل التكاليف حسب الفئة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>المواد المباشرة</span>
                        <span className="font-semibold">
                          {formatCurrency(costAnalysis.costsByCategory.directMaterials)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>العمالة المباشرة</span>
                        <span className="font-semibold">
                          {formatCurrency(costAnalysis.costsByCategory.directLabor)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>التكاليف الصناعية غير المباشرة</span>
                        <span className="font-semibold">
                          {formatCurrency(costAnalysis.costsByCategory.manufacturingOverhead)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>المصروفات التشغيلية</span>
                        <span className="font-semibold">
                          {formatCurrency(costAnalysis.costsByCategory.operatingExpenses)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>المصروفات الإدارية</span>
                        <span className="font-semibold">
                          {formatCurrency(costAnalysis.costsByCategory.administrativeExpenses)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>تحليل الربحية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>إجمالي الإيرادات</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(costAnalysis.profitabilityAnalysis.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>إجمالي التكاليف</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(costAnalysis.profitabilityAnalysis.totalCosts)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الربح الإجمالي</span>
                        <span className={`font-semibold ${costAnalysis.profitabilityAnalysis.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(costAnalysis.profitabilityAnalysis.grossProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>هامش الربح الإجمالي</span>
                        <span className={`font-semibold ${costAnalysis.profitabilityAnalysis.grossProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {costAnalysis.profitabilityAnalysis.grossProfitMargin.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Centers Breakdown */}
              {Object.keys(costAnalysis.costsByCenter).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>التكاليف حسب مراكز التكلفة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(costAnalysis.costsByCenter).map(([centerName, amount]) => (
                        <div key={centerName} className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">{centerName}</h4>
                          <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Date Range Controls */}
          <Card>
            <CardHeader>
              <CardTitle>تحديث التحليل</CardTitle>
              <CardDescription>
                اختر الفترة الزمنية للتحليل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="analysisStartDate">تاريخ البداية</Label>
                  <Input
                    id="analysisStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysisEndDate">تاريخ النهاية</Label>
                  <Input
                    id="analysisEndDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button onClick={updateAnalysis} className="mt-7">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  تحديث التحليل
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Centers Tab */}
        <TabsContent value="centers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    مراكز التكلفة
                  </CardTitle>
                  <CardDescription>
                    إدارة مراكز التكلفة وتوزيع المصروفات
                  </CardDescription>
                </div>
                <Dialog open={isCreateCenterOpen} onOpenChange={setIsCreateCenterOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetCenterForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      إنشاء مركز تكلفة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء مركز تكلفة جديد</DialogTitle>
                      <DialogDescription>
                        أنشئ مركز تكلفة جديد لتنظيم وتتبع التكاليف
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="centerName">اسم مركز التكلفة</Label>
                        <Input
                          id="centerName"
                          value={centerForm.name}
                          onChange={(e) => setCenterForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="مثال: مركز تكلفة الإنتاج"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="centerCategory">الفئة</Label>
                        <Select value={centerForm.category} onValueChange={(value: any) => setCenterForm(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="production">إنتاج</SelectItem>
                            <SelectItem value="sales">مبيعات</SelectItem>
                            <SelectItem value="admin">إداري</SelectItem>
                            <SelectItem value="hr">موارد بشرية</SelectItem>
                            <SelectItem value="marketing">تسويق</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="centerDescription">الوصف</Label>
                        <Textarea
                          id="centerDescription"
                          value={centerForm.description}
                          onChange={(e) => setCenterForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="وصف مختصر لمركز التكلفة"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateCenterOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleCreateCostCenter}>
                        إنشاء مركز التكلفة
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {costCenters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد مراكز تكلفة</p>
                  <p className="text-sm">قم بإنشاء مركز تكلفة جديد للبدء</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {costCenters.map((center) => (
                    <div
                      key={center.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{center.name}</h3>
                          <Badge className={getCategoryColor(center.category)}>
                            {getCategoryLabel(center.category)}
                          </Badge>
                          <Badge variant={center.isActive ? "default" : "secondary"}>
                            {center.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{center.description}</p>
                        <p className="text-xs text-muted-foreground">
                          تم الإنشاء: {formatDate(center.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditCenter(center)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCostCenter(center.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Costs Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    تكاليف المنتجات
                  </CardTitle>
                  <CardDescription>
                    تحليل تفصيلي لتكاليف كل منتج وربحيته
                  </CardDescription>
                </div>
                <Button 
                  onClick={calculateProductCosts}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      جاري الحساب...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      حساب التكاليف
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productCosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد تكاليف محسوبة للمنتجات</p>
                  <p className="text-sm">قم بحساب التكاليف للبدء</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-right">المنتج</th>
                        <th className="border border-border p-2 text-right">تكلفة المواد</th>
                        <th className="border border-border p-2 text-right">تكلفة العمالة</th>
                        <th className="border border-border p-2 text-right">التكاليف الإضافية</th>
                        <th className="border border-border p-2 text-right">إجمالي التكلفة</th>
                        <th className="border border-border p-2 text-right">سعر البيع</th>
                        <th className="border border-border p-2 text-right">الربح</th>
                        <th className="border border-border p-2 text-right">هامش الربح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productCosts.map((cost) => (
                        <tr key={cost.productId} className="hover:bg-muted/50">
                          <td className="border border-border p-2 font-medium">{cost.productName}</td>
                          <td className="border border-border p-2">{formatCurrency(cost.directMaterialCost)}</td>
                          <td className="border border-border p-2">{formatCurrency(cost.directLaborCost)}</td>
                          <td className="border border-border p-2">{formatCurrency(cost.manufacturingOverhead + cost.allocatedIndirectCost)}</td>
                          <td className="border border-border p-2 font-semibold">{formatCurrency(cost.totalCost)}</td>
                          <td className="border border-border p-2">{formatCurrency(cost.sellingPrice)}</td>
                          <td className={`border border-border p-2 font-semibold ${cost.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(cost.profitAmount)}
                          </td>
                          <td className={`border border-border p-2 font-semibold ${cost.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {cost.profitMargin.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {costAnalysis ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>تحليل مفصل للتكاليف</CardTitle>
                  <CardDescription>
                    الفترة: {formatDate(costAnalysis.period.start)} - {formatDate(costAnalysis.period.end)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">تحليل التكاليف المتغيرة مقابل الثابتة</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>التكاليف المتغيرة</span>
                          <span className="font-semibold">{formatCurrency(costAnalysis.variableCosts)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>التكاليف الثابتة</span>
                          <span className="font-semibold">{formatCurrency(costAnalysis.fixedCosts)}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between font-semibold">
                            <span>إجمالي التكاليف</span>
                            <span>{formatCurrency(costAnalysis.totalCosts)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">نسب التكاليف</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>نسبة التكاليف المتغيرة</span>
                          <span className="font-semibold">
                            {costAnalysis.totalCosts > 0 ? ((costAnalysis.variableCosts / costAnalysis.totalCosts) * 100).toFixed(2) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>نسبة التكاليف الثابتة</span>
                          <span className="font-semibold">
                            {costAnalysis.totalCosts > 0 ? ((costAnalysis.fixedCosts / costAnalysis.totalCosts) * 100).toFixed(2) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {Object.keys(costAnalysis.costPerUnit).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>تكلفة الوحدة لكل منتج</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(costAnalysis.costPerUnit).map(([productId, cost]) => (
                        <div key={productId} className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">المنتج</p>
                          <p className="font-medium">{productId}</p>
                          <p className="text-lg font-bold">{formatCurrency(cost)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">لا يوجد تحليل متاح</h3>
                <p className="text-muted-foreground mb-4">
                  قم بتحديث التحليل من النظرة العامة للحصول على البيانات
                </p>
                <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  انتقل للنظرة العامة
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    تقارير التكاليف
                  </CardTitle>
                  <CardDescription>
                    إنشاء وإدارة التقارير المختلفة للتكاليف
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => generateCostReport('product_costing')} variant="outline">
                    تقرير تكاليف المنتجات
                  </Button>
                  <Button onClick={() => generateCostReport('cost_center')} variant="outline">
                    تقرير مراكز التكلفة
                  </Button>
                  <Button onClick={() => generateCostReport('profitability')} variant="outline">
                    تقرير الربحية
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {costReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد تقارير محفوظة</p>
                  <p className="text-sm">قم بإنشاء تقرير جديد للبدء</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {costReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{report.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>النوع: {report.type}</span>
                          <span>الفترة: {formatDate(report.period.start)} - {formatDate(report.period.end)}</span>
                          <span>تم الإنشاء: {formatDate(report.generatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          تصدير
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Cost Center Dialog */}
      <Dialog open={isEditCenterOpen} onOpenChange={setIsEditCenterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل مركز التكلفة</DialogTitle>
            <DialogDescription>
              تعديل بيانات مركز التكلفة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCenterName">اسم مركز التكلفة</Label>
              <Input
                id="editCenterName"
                value={centerForm.name}
                onChange={(e) => setCenterForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCenterCategory">الفئة</Label>
              <Select value={centerForm.category} onValueChange={(value: any) => setCenterForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">إنتاج</SelectItem>
                  <SelectItem value="sales">مبيعات</SelectItem>
                  <SelectItem value="admin">إداري</SelectItem>
                  <SelectItem value="hr">موارد بشرية</SelectItem>
                  <SelectItem value="marketing">تسويق</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCenterDescription">الوصف</Label>
              <Textarea
                id="editCenterDescription"
                value={centerForm.description}
                onChange={(e) => setCenterForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCenterOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateCostCenter}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}