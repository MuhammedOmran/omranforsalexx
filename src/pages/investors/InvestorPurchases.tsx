import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Package, DollarSign, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInvestor } from "@/contexts/InvestorContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InvestorPurchases() {
  const { toast } = useToast();
  const { investors, purchases, addPurchase, getInvestorPurchases } = useInvestor();
  
  const [formData, setFormData] = useState({
    investorId: "",
    date: "",
    productType: "",
    quantity: "",
    price: "",
    supplier: "",
    invoiceNumber: ""
  });

  const [selectedInvestor, setSelectedInvestor] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.investorId || !formData.date || !formData.productType || !formData.quantity || !formData.price || !formData.supplier) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const totalCost = parseFloat(formData.quantity) * parseFloat(formData.price);
    const investor = investors.find(inv => inv.id === formData.investorId);
    
    if (!investor || investor.remainingAmount < totalCost) {
      toast({
        title: "خطأ",
        description: "المبلغ المتبقي للمستثمر غير كافي لهذه العملية",
        variant: "destructive"
      });
      return;
    }

    addPurchase({
      investorId: formData.investorId,
      date: formData.date,
      productType: formData.productType,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
      supplier: formData.supplier,
      totalCost,
      invoiceNumber: formData.invoiceNumber
    });

    toast({
      title: "تم الحفظ",
      description: "تم إضافة فاتورة الشراء بنجاح"
    });

    setFormData({
      investorId: "",
      date: "",
      productType: "",
      quantity: "",
      price: "",
      supplier: "",
      invoiceNumber: ""
    });
    setShowAddDialog(false);
  };

  const filteredPurchases = selectedInvestor && selectedInvestor !== "all"
    ? getInvestorPurchases(selectedInvestor)
    : purchases;

  const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-6 h-full overflow-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">مشتريات المستثمرين</h1>
          <p className="text-muted-foreground">إدارة فواتير الشراء الخاصة بكل مستثمر</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة فاتورة شراء
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
            <DialogHeader className="shrink-0">
              <DialogTitle>إضافة فاتورة شراء جديدة</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="investorId">اسم المستثمر *</Label>
                <Select value={formData.investorId} onValueChange={(value) => handleInputChange("investorId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستثمر" />
                  </SelectTrigger>
                  <SelectContent>
                    {investors.map((investor) => (
                      <SelectItem key={investor.id} value={investor.id}>
                        {investor.name} - متبقي: {investor.remainingAmount.toLocaleString()} ج.م
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productType">نوع البضاعة *</Label>
                <Input
                  id="productType"
                  value={formData.productType}
                  onChange={(e) => handleInputChange("productType", e.target.value)}
                  placeholder="أدخل نوع البضاعة"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ج.م) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">اسم المورد *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange("supplier", e.target.value)}
                  placeholder="أدخل اسم المورد"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
                <Input
                  id="invoiceNumber"
                  value={`PUR${String(purchases.length + 1).padStart(3, '0')}`}
                  readOnly
                  className="bg-muted"
                />
              </div>

              {formData.quantity && formData.price && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">
                    إجمالي التكلفة: {(parseFloat(formData.quantity || "0") * parseFloat(formData.price || "0")).toLocaleString()} ج.م
                  </div>
                </div>
              )}

              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t shrink-0">
              <Button onClick={handleSubmit} className="flex-1">
                حفظ الفاتورة
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>فلترة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="investorFilter">اختر المستثمر</Label>
              <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستثمرين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستثمرين</SelectItem>
                  {investors.map((investor) => (
                    <SelectItem key={investor.id} value={investor.id}>
                      {investor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setSelectedInvestor("all")}>
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedInvestor && selectedInvestor !== "all"
              ? `إجمالي مشتريات ${investors.find(inv => inv.id === selectedInvestor)?.name}` 
              : "إجمالي جميع المشتريات"
            }
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPurchases.toLocaleString()} ج.م</div>
          <p className="text-xs text-muted-foreground">
            {filteredPurchases.length} فاتورة شراء
          </p>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة فواتير الشراء</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto max-h-96 overflow-y-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>المستثمر</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>نوع البضاعة</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المورد</TableHead>
                  <TableHead>إجمالي التكلفة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  const investor = investors.find(inv => inv.id === purchase.investorId);
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {purchase.invoiceNumber || purchase.id}
                        </div>
                      </TableCell>
                      <TableCell>{investor?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {purchase.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {purchase.productType}
                        </div>
                      </TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell>{purchase.price.toLocaleString()} ج.م</TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell className="font-medium">
                        {purchase.totalCost.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          مكتملة
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد فواتير شراء متاحة
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}