import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Wrench,
  Trash2,
  RotateCcw,
  ArrowUpRight
} from "lucide-react";
import { returnsManager } from "@/utils/returnsManager";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  returnId: string;
  returnDate: string;
  condition: 'good' | 'damaged' | 'defective' | 'expired';
  action: 'restock' | 'repair' | 'dispose' | 'exchange' | 'pending';
  location: string;
  quantity: number;
  originalPrice: number;
  recoveryValue: number;
  notes: string;
  customerName: string;
  reason: string;
}

interface InventoryStats {
  totalItems: number;
  pendingReview: number;
  readyForRestock: number;
  needsRepair: number;
  toDispose: number;
  totalValue: number;
  recoveryRate: number;
}

export function ReturnsInventoryTracker() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  const inventoryData = useMemo(() => {
    const returns = returnsManager.getReturns();
    
    // تحويل المرتجعات إلى عناصر مخزون
    const items: InventoryItem[] = [];
    
    returns.forEach(returnItem => {
      returnItem.items.forEach(item => {
        items.push({
          id: `${returnItem.id}-${item.productId}`,
          productName: item.productName,
          sku: item.productId,
          returnId: returnItem.id,
          returnDate: returnItem.createdAt,
          condition: item.reason === 'defective' ? 'defective' : 
                    item.reason === 'damaged' ? 'damaged' :
                    item.reason === 'wrong_item' ? 'good' : 'good',
          action: returnItem.status === 'processed' ? 'restock' : 'pending',
          location: 'مستودع المرتجعات',
          quantity: item.quantity,
          originalPrice: item.total / item.quantity,
          recoveryValue: item.reason === 'defective' ? (item.total / item.quantity) * 0.1 :
                        item.reason === 'damaged' ? (item.total / item.quantity) * 0.3 :
                        (item.total / item.quantity) * 0.8,
          notes: '',
          customerName: returnItem.customerName,
          reason: item.reason || 'customer_change'
        });
      });
    });

    // حساب الإحصائيات
    const stats: InventoryStats = {
      totalItems: items.length,
      pendingReview: items.filter(item => item.action === 'pending').length,
      readyForRestock: items.filter(item => item.action === 'restock').length,
      needsRepair: items.filter(item => item.action === 'repair').length,
      toDispose: items.filter(item => item.action === 'dispose').length,
      totalValue: items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0),
      recoveryRate: items.length > 0 ? 
        (items.reduce((sum, item) => sum + item.recoveryValue * item.quantity, 0) / 
         items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0) * 100) : 0
    };

    // تطبيق المرشحات
    const filteredItems = items.filter(item => {
      const conditionMatch = filterCondition === 'all' || item.condition === filterCondition;
      const actionMatch = filterAction === 'all' || item.action === filterAction;
      return conditionMatch && actionMatch;
    });

    return { items: filteredItems, stats, allItems: items };
  }, [filterCondition, filterAction]);

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast.error("يرجى تحديد العناصر أولاً");
      return;
    }

    const actionLabels = {
      restock: 'إعادة تخزين',
      repair: 'إرسال للإصلاح',
      dispose: 'إعدام',
      exchange: 'استبدال'
    };

    toast.success(`تم ${actionLabels[action as keyof typeof actionLabels]} ${selectedItems.length} عنصر`);
    setSelectedItems([]);
  };

  const getConditionBadge = (condition: string) => {
    const styles = {
      good: 'bg-green-100 text-green-700',
      damaged: 'bg-orange-100 text-orange-700',
      defective: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700'
    };

    const labels = {
      good: 'جيد',
      damaged: 'تالف',
      defective: 'معيب',
      expired: 'منتهي الصلاحية'
    };

    return (
      <Badge variant="secondary" className={styles[condition as keyof typeof styles]}>
        {labels[condition as keyof typeof labels]}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    const icons = {
      restock: <ArrowUpRight className="h-4 w-4 text-green-600" />,
      repair: <Wrench className="h-4 w-4 text-blue-600" />,
      dispose: <Trash2 className="h-4 w-4 text-red-600" />,
      exchange: <RotateCcw className="h-4 w-4 text-purple-600" />,
      pending: <AlertTriangle className="h-4 w-4 text-yellow-600" />
    };

    return icons[action as keyof typeof icons] || null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* إحصائيات المخزون */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العناصر</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in">{inventoryData.stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في انتظار المراجعة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-yellow-600">
              {inventoryData.stats.pendingReview}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جاهز للتخزين</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-green-600">
              {inventoryData.stats.readyForRestock}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">يحتاج إصلاح</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-blue-600">
              {inventoryData.stats.needsRepair}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold animate-scale-in text-purple-600">
              {inventoryData.stats.totalValue.toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الاسترداد</CardTitle>
            <RefreshCw className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-indigo-600">
              {inventoryData.stats.recoveryRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* مرشحات وعمليات مجمعة */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            إدارة مخزون المرتجعات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={filterCondition} onValueChange={setFilterCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="تصفية حسب الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="good">جيد</SelectItem>
                    <SelectItem value="damaged">تالف</SelectItem>
                    <SelectItem value="defective">معيب</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="تصفية حسب الإجراء" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الإجراءات</SelectItem>
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="restock">إعادة تخزين</SelectItem>
                    <SelectItem value="repair">إصلاح</SelectItem>
                    <SelectItem value="dispose">إعدام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* العمليات المجمعة */}
          {selectedItems.length > 0 && (
            <Alert className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span>تم تحديد {selectedItems.length} عنصر</span>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleBulkAction('restock')}
                      className="hover-scale"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      إعادة تخزين
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleBulkAction('repair')}
                      className="hover-scale"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      إرسال للإصلاح
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleBulkAction('dispose')}
                      className="hover-scale"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      إعدام
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* جدول العناصر */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>عناصر المخزون المرتجعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(inventoryData.items.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>القيمة الأصلية</TableHead>
                  <TableHead>قيمة الاسترداد</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>تاريخ الإرجاع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item.id]);
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getConditionBadge(item.condition)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(item.action)}
                        <span className="text-sm">
                          {item.action === 'pending' ? 'في الانتظار' :
                           item.action === 'restock' ? 'إعادة تخزين' :
                           item.action === 'repair' ? 'إصلاح' :
                           item.action === 'dispose' ? 'إعدام' : item.action}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.originalPrice.toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{item.recoveryValue.toLocaleString()} ر.س</span>
                        <span className="text-xs text-muted-foreground">
                          {((item.recoveryValue / item.originalPrice) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>
                      {new Date(item.returnDate).toLocaleDateString('en-GB')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {inventoryData.items.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عناصر مخزون مطابقة للمرشحات المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}