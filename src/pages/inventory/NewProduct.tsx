import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, Save, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { inventoryManager } from "@/utils/inventoryUtils";
import { useSuppliers } from "@/hooks/useSuppliers";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// قائمة المستثمرين مع أكوادهم
const investors: { id: string; name: string }[] = [];

export default function NewProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { suppliers, fetchSuppliers, addSupplier } = useSuppliers();
  const { user } = useSupabaseAuth();

  // Generate next product code
  const getNextProductCode = () => {
    const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const nextId = existingProducts.length + 1;
    return `PRD${nextId.toString().padStart(3, '0')}`;
  };

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    barcode: getNextProductCode(),
    category: "",
    buyingPrice: "",
    sellingPrice: "",
    quantity: "",
    minQuantity: "",
    unit: undefined as string | undefined,
    profit: "",
    profitPercentage: "",
    supplier_id: undefined as string | undefined,
  });

  const [showAddSupplierDialog, setShowAddSupplierDialog] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    name: "",
    email: "",
    phone: "",
    contact_person: ""
  });

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleInputChange = (field: string, value: string) => {
    setProductData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Only calculate profit and profit percentage, NEVER modify the selling price
      if (field === 'buyingPrice' || field === 'sellingPrice') {
        const buying = parseFloat(field === 'buyingPrice' ? value : prev.buyingPrice) || 0;
        const selling = parseFloat(field === 'sellingPrice' ? value : prev.sellingPrice) || 0;
        const profit = selling - buying;
        const profitPercentage = buying > 0 ? ((profit / buying) * 100) : 0;
        
        // Only update calculated values, keep user input intact
        updated.profit = profit.toFixed(2);
        updated.profitPercentage = profitPercentage.toFixed(2);
      }
      
      return updated;
    });
  };


  const handleSubmit = async () => {
    console.log("Submit button clicked", productData);
    
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      return;
    }
    
    // التحقق من الحقول المطلوبة
    if (!productData.name) {
      console.log("Product name is missing");
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    console.log("Creating new product...");
    
    try {
      // إنشاء المنتج في Supabase
      const productToInsert = {
        name: productData.name,
        code: productData.barcode || `P${Date.now()}`,
        price: parseFloat(productData.sellingPrice) || 0,
        cost: parseFloat(productData.buyingPrice) || 0,
        stock: parseInt(productData.quantity) || 0,
        min_stock: parseInt(productData.minQuantity) || 0,
        category: productData.category || null,
        description: productData.description || null,
        unit: productData.unit || 'قطعة',
        supplier: productData.supplier_id && productData.supplier_id !== "no_supplier" ? 
          suppliers.find(s => s.id === productData.supplier_id)?.name || null : null,
        user_id: user.id
      };

      const { data: supabaseProduct, error } = await supabase
        .from('products')
        .insert(productToInsert)
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // إنشاء المنتج للـ localStorage أيضاً (للتوافق)
      const newProduct = {
        id: supabaseProduct.id,
        name: productData.name,
        code: productData.barcode || `PRD${Date.now()}`,
        category: productData.category,
        stock: parseInt(productData.quantity) || 0,
        minStock: parseInt(productData.minQuantity) || 0,
        price: parseFloat(productData.sellingPrice) || 0,
        cost: parseFloat(productData.buyingPrice) || 0,
        description: productData.description,
        status: "active" as const,
        profit: parseFloat(productData.profit) || 0,
        profitPercentage: parseFloat(productData.profitPercentage) || 0,
        barcode: productData.barcode,
        ownerType: "company" as const,
        supplier_id: productData.supplier_id && productData.supplier_id !== "no_supplier" ? productData.supplier_id : null
      };

      console.log("New product created:", newProduct);

      // حفظ المنتج في localStorage مع تحديث inventoryManager
      const existingProducts = inventoryManager.getProducts();
      const updatedProducts = [...existingProducts, newProduct];
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      // تحديث بيانات المخزون
      inventoryManager.syncProductsWithStock();
      
      // إضافة حركة دخول للمخزون
      if (newProduct.stock > 0) {
        inventoryManager.addMovement({
          productId: newProduct.id,
          productName: newProduct.name,
          code: newProduct.code,
          type: 'in',
          quantity: newProduct.stock,
          date: new Date().toISOString(),
          reason: 'رصيد افتتاحي',
          value: newProduct.stock * newProduct.cost,
          referenceType: 'adjustment',
          notes: 'إضافة منتج جديد - رصيد افتتاحي',
          ownerType: 'company'
        });
      }
      
      console.log("Product saved successfully");

      toast({
        title: "تم الحفظ",
        description: "تم إضافة المنتج بنجاح وربطه بالمورد"
      });

      console.log("Navigating back...");
      navigate(-1);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المنتج",
        variant: "destructive"
      });
    }
  };

  const handleAddNewSupplier = async () => {
    if (!newSupplierData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المورد",
        variant: "destructive"
      });
      return;
    }

    const result = await addSupplier(newSupplierData);
    if (result) {
      setProductData(prev => ({ ...prev, supplier_id: 'temp-supplier' }));
      setShowAddSupplierDialog(false);
      setNewSupplierData({ name: "", email: "", phone: "", contact_person: "" });
    }
  };

  return (
    <div className="min-h-screen max-h-screen overflow-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-4 sticky top-0 bg-background z-10 pb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-cairo">منتج جديد</h1>
          <p className="text-muted-foreground font-cairo">إضافة منتج جديد إلى المخزون</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Package className="h-5 w-5" />
            بيانات المنتج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* معلومات المنتج الأساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName" className="font-tajawal">اسم المنتج *</Label>
              <Input
                id="productName"
                value={productData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="أدخل اسم المنتج"
                className="font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode" className="font-tajawal">كود المنتج</Label>
              <Input
                id="barcode"
                value={productData.barcode}
                readOnly
                className="bg-muted font-tajawal"
                placeholder="يتم إنشاؤه تلقائياً"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-tajawal">وصف المنتج</Label>
            <Textarea
              id="description"
              value={productData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="أدخل وصف المنتج"
              className="font-tajawal"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-tajawal">الفئة</Label>
              <Input
                id="category"
                placeholder="أدخل فئة المنتج"
                value={productData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit" className="font-tajawal">الوحدة</Label>
              <Select value={productData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger className="font-tajawal">
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece" className="font-tajawal">قطعة</SelectItem>
                  <SelectItem value="kg" className="font-tajawal">كيلوجرام</SelectItem>
                  <SelectItem value="liter" className="font-tajawal">لتر</SelectItem>
                  <SelectItem value="meter" className="font-tajawal">متر</SelectItem>
                  <SelectItem value="box" className="font-tajawal">علبة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* قسم المورد */}
          <div className="space-y-2">
            <Label htmlFor="supplier" className="font-tajawal">المورد</Label>
            <div className="flex gap-2">
              <Select 
                value={productData.supplier_id} 
                onValueChange={(value) => handleInputChange("supplier_id", value)}
              >
                <SelectTrigger className="flex-1 font-tajawal">
                  <SelectValue placeholder="اختر المورد (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_supplier" className="font-tajawal">بدون مورد</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id} className="font-tajawal">
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showAddSupplierDialog} onOpenChange={setShowAddSupplierDialog}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة مورد جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم المورد *</Label>
                      <Input
                        value={newSupplierData.name}
                        onChange={(e) => setNewSupplierData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="أدخل اسم المورد"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={newSupplierData.email}
                        onChange={(e) => setNewSupplierData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="أدخل البريد الإلكتروني"
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={newSupplierData.phone}
                        onChange={(e) => setNewSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="أدخل رقم الهاتف"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الشخص المسؤول</Label>
                      <Input
                        value={newSupplierData.contact_person}
                        onChange={(e) => setNewSupplierData(prev => ({ ...prev, contact_person: e.target.value }))}
                        placeholder="اسم الشخص المسؤول"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddNewSupplier} className="flex-1">
                        <Save className="h-4 w-4 ml-2" />
                        حفظ المورد
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddSupplierDialog(false)} 
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* الأسعار والأرباح */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyingPrice" className="font-tajawal">سعر التكلفة</Label>
              <div className="relative">
                <Input
                  id="buyingPrice"
                  type="number"
                  value={productData.buyingPrice}
                  onChange={(e) => handleInputChange("buyingPrice", e.target.value)}
                  placeholder=""
                  className="font-tajawal"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="font-tajawal">سعر البيع</Label>
              <div className="relative">
                <Input
                  id="sellingPrice"
                  type="number"
                  value={productData.sellingPrice}
                  onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                  placeholder=""
                  className="font-tajawal"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ج.م</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profit" className="font-tajawal">ربح المنتج (ج.م)</Label>
              <Input
                id="profit"
                value={productData.profit}
                readOnly
                className="bg-muted font-tajawal"
                placeholder="يتم حسابه تلقائياً"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profitPercentage" className="font-tajawal">نسبة الربح (%)</Label>
              <Input
                id="profitPercentage"
                value={productData.profitPercentage}
                readOnly
                className="bg-muted font-tajawal"
                placeholder="يتم حسابها تلقائياً"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="font-tajawal">الكمية الحالية</Label>
              <Input
                id="quantity"
                type="number"
                value={productData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder=""
                className="font-tajawal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minQuantity" className="font-tajawal">الحد الأدنى للكمية</Label>
              <Input
                id="minQuantity"
                type="number"
                value={productData.minQuantity}
                onChange={(e) => handleInputChange("minQuantity", e.target.value)}
                placeholder=""
                className="font-tajawal"
              />
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1 font-cairo">
              <Save className="h-4 w-4 ml-2" />
              حفظ المنتج
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 font-cairo">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}