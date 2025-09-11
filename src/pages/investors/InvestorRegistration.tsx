import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Phone, DollarSign, Calendar, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInvestor } from "@/contexts/InvestorContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InvestorRegistration() {
  const { toast } = useToast();
  const { investors, addInvestor, updateInvestor } = useInvestor();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    investedAmount: "",
    depositDate: "",
    profitPercentage: "",
    notes: ""
  });

  const [editingInvestor, setEditingInvestor] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.investedAmount || !formData.depositDate || !formData.profitPercentage) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (editingInvestor) {
        updateInvestor(editingInvestor, {
          name: formData.name,
          phone: formData.phone,
          investedAmount: parseFloat(formData.investedAmount),
          depositDate: formData.depositDate,
          profitPercentage: parseFloat(formData.profitPercentage),
          notes: formData.notes
        });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المستثمر بنجاح"
      });
      setEditingInvestor(null);
    } else {
        addInvestor({
          name: formData.name,
          phone: formData.phone,
          investedAmount: parseFloat(formData.investedAmount),
          depositDate: formData.depositDate,
          profitPercentage: parseFloat(formData.profitPercentage),
          notes: formData.notes
        });
      toast({
        title: "تم الحفظ",
        description: "تم تسجيل المستثمر بنجاح"
      });
    }

    setFormData({
      name: "",
      phone: "",
      investedAmount: "",
      depositDate: "",
      profitPercentage: "",
      notes: ""
    });
    setShowAddDialog(false);
  };

  const handleEdit = (investor: any) => {
    setFormData({
      name: investor.name,
      phone: investor.phone,
      investedAmount: investor.investedAmount.toString(),
      depositDate: investor.depositDate,
      profitPercentage: investor.profitPercentage?.toString() || "",
      notes: investor.notes || ""
    });
    setEditingInvestor(investor.id);
    setShowAddDialog(true);
  };

  const totalInvested = investors.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalRemaining = investors.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-6 h-full overflow-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المستثمرين</h1>
          <p className="text-muted-foreground">تسجيل وإدارة المستثمرين في النظام</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="ml-2 h-4 w-4" />
              إضافة مستثمر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                {editingInvestor ? "تعديل بيانات المستثمر" : "إضافة مستثمر جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investedAmount">المبلغ المستثمر *</Label>
                <div className="relative">
                  <Input
                    id="investedAmount"
                    type="number"
                    value={formData.investedAmount}
                    onChange={(e) => handleInputChange("investedAmount", e.target.value)}
                    placeholder="0"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositDate">تاريخ الإيداع *</Label>
                <Input
                  id="depositDate"
                  type="date"
                  value={formData.depositDate}
                  onChange={(e) => handleInputChange("depositDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profitPercentage">نسبة الربح (%) *</Label>
                <div className="relative">
                  <Input
                    id="profitPercentage"
                    type="number"
                    value={formData.profitPercentage}
                    onChange={(e) => handleInputChange("profitPercentage", e.target.value)}
                    placeholder="0"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية"
                  rows={3}
                />
              </div>

              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t shrink-0">
              <Button onClick={handleSubmit} className="flex-1">
                {editingInvestor ? "تحديث البيانات" : "حفظ المستثمر"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingInvestor(null);
                  setFormData({
                    name: "",
                    phone: "",
                    investedAmount: "",
                    depositDate: "",
                    profitPercentage: "",
                    notes: ""
                  });
                }} 
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المستثمرين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investors.length}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي المستثمرين المسجلين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستثمارات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvested.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              إجمالي الأموال المستثمرة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المتبقي</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{totalRemaining.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground">
              إجمالي المبالغ المتبقية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investors Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستثمرين</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto max-h-96 overflow-y-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المستثمر</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>المبلغ المستثمر</TableHead>
                  <TableHead>المبلغ المتبقي</TableHead>
                  <TableHead>تاريخ الإيداع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {investors.length > 0 ? (
                investors.map((investor) => {
                  const utilizationRate = ((investor.investedAmount - investor.remainingAmount) / investor.investedAmount) * 100;
                  
                  return (
                    <TableRow key={investor.id}>
                      <TableCell className="font-medium">{investor.id}</TableCell>
                      <TableCell>{investor.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {investor.phone}
                        </div>
                      </TableCell>
                      <TableCell>{investor.investedAmount.toLocaleString()} ج.م</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {investor.remainingAmount.toLocaleString()} ج.م
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {investor.depositDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={investor.remainingAmount > investor.investedAmount * 0.2 ? "default" : "destructive"}>
                          {investor.remainingAmount > investor.investedAmount * 0.2 ? "نشط" : "يحتاج متابعة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(investor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا يوجد مستثمرون مسجلون حتى الآن
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