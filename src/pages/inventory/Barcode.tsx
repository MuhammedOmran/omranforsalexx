import { useState, useEffect } from "react";
import { Scan, QrCode, Printer, Download, Search, Plus, Package, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useToast } from "@/hooks/use-toast";

interface BarcodeProduct {
  id: string;
  name: string;
  code: string;
  barcode: string;
  price: number;
  category: string;
}

const mockProducts: BarcodeProduct[] = [];

// دالة إنشاء الباركود
const generateBarcode = () => {
  return Math.floor(Math.random() * 9000000000000) + 1000000000000;
};

export default function Barcode() {
  const { products: supabaseProducts, loading, error, updateProduct, createProduct } = useSupabaseProducts();

  // تحويل منتجات Supabase إلى تنسيق الباركود مع التحقق من الباركود المفقود
  const products: BarcodeProduct[] = supabaseProducts.map(product => {
    let barcode = product.barcode;
    
    // إذا لم يكن هناك باركود، قم بإنشاء واحد جديد وحفظه
    if (!barcode) {
      barcode = generateBarcode().toString();
      // تحديث المنتج في قاعدة البيانات بالباركود الجديد
      updateProduct(product.id, { barcode }).catch(console.error);
    }
    
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      barcode,
      price: product.price,
      category: product.category || 'غير محدد'
    };
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BarcodeProduct | null>(null);
  const [scannedCode, setScannedCode] = useState("");
  const [foundProduct, setFoundProduct] = useState<BarcodeProduct | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    price: "",
    category: ""
  });
  
  const { toast } = useToast();

  const filteredProducts = (products || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode || '').includes(searchTerm)
  );

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };


  const handleGenerateNewBarcode = async (productId: string) => {
    const newBarcode = generateBarcode().toString();
    
    try {
      await updateProduct(productId, { barcode: newBarcode });
      toast({
        title: "تم التحديث",
        description: "تم إنشاء باركود جديد للمنتج"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الباركود",
        variant: "destructive"
      });
    }
  };

  const handleScanBarcode = () => {
    const product = products.find(p => p.barcode === scannedCode);
    if (product) {
      setFoundProduct(product);
    } else {
      setFoundProduct(null);
    }
  };

  const printBarcodes = () => {
    if (selectedProducts.length === 0) {
      return;
    }
    
    const selectedProductsData = (products || []).filter(p => selectedProducts.includes(p.id));
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "خطأ في فتح النافذة",
        description: "يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير",
        variant: "destructive"
      });
      return;
    }
    
    // حساب الإحصائيات
    const totalValue = selectedProductsData.reduce((sum, product) => sum + product.price, 0);
    const avgPrice = selectedProductsData.length > 0 ? totalValue / selectedProductsData.length : 0;
    
    // Generate print content with professional design
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير طباعة الباركود</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            direction: rtl; 
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .title { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #1e40af;
          }
          .subtitle { 
            font-size: 16px; 
            color: #64748b; 
            margin-bottom: 20px; 
          }
          .info { 
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .info-label {
            font-weight: 600;
            color: #374151;
          }
          .info-value {
            font-weight: bold;
            color: #1e40af;
          }
          .section { 
            margin: 30px 0; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 20px; 
            font-weight: bold; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 8px; 
            margin-bottom: 20px; 
            color: #374151;
          }
          .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 25px 0; 
          }
          .stat-item { 
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .stat-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #1e40af; 
          }
          .stat-label { 
            font-size: 14px; 
            color: #64748b; 
            margin-top: 5px;
          }
          .barcode-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .barcode-item { 
            border: 2px solid #e5e7eb; 
            padding: 20px; 
            border-radius: 12px;
            background: white;
            page-break-inside: avoid;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .product-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #1e40af;
          }
          .product-code { 
            font-size: 14px; 
            color: #64748b; 
            margin-bottom: 8px; 
          }
          .product-price {
            font-size: 16px;
            font-weight: 600;
            color: #059669;
            margin-bottom: 15px;
          }
          .barcode-visual { 
            width: 100%; 
            height: 60px; 
            background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px); 
            margin: 15px 0;
            border: 1px solid #d1d5db;
            border-radius: 4px;
          }
          .barcode-display { 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
            letter-spacing: 2px; 
            text-align: center;
            background: #f9fafb;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            font-weight: bold;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b; 
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .barcode-item { break-inside: avoid; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير طباعة الباركود</h1>
          <div class="subtitle">عرض الباركود للمنتجات المحددة</div>
          <div class="info">
            <div class="info-item">
              <span class="info-label">تاريخ التقرير:</span>
              <span class="info-value">${new Date().toLocaleDateString('en-GB')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">عدد المنتجات:</span>
              <span class="info-value">${selectedProductsData.length}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">الملخص الإحصائي</h2>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${selectedProductsData.length}</div>
              <div class="stat-label">إجمالي عدد المنتجات</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${totalValue.toLocaleString()} ج.م</div>
              <div class="stat-label">إجمالي قيمة المنتجات</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${avgPrice.toFixed(2)} ج.م</div>
              <div class="stat-label">متوسط سعر المنتج</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">بيانات الباركود للمنتجات</h2>
          <div class="barcode-grid">
            ${selectedProductsData.map(product => `
              <div class="barcode-item">
                <div class="product-name">${product.name}</div>
                <div class="product-code">كود المنتج: ${product.code}</div>
                <div class="product-price">السعر: ${product.price} ج.م</div>
                <div class="barcode-visual"></div>
                <div class="barcode-display">${product.barcode}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات والمخزون</p>
          <p>تاريخ الإنشاء: ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const exportBarcodes = () => {
    if (selectedProducts.length === 0) {
      return;
    }
    
    const selectedProductsData = (products || []).filter(p => selectedProducts.includes(p.id));
    
    // Create CSV content
    const csvHeader = "اسم المنتج,كود المنتج,الباركود,السعر,الفئة\n";
    const csvContent = selectedProductsData.map(product => 
      `"${product.name}","${product.code}","${product.barcode}","${product.price}","${product.category}"`
    ).join('\n');
    
    const fullCsvContent = csvHeader + csvContent;
    
    // Create and download file
    const blob = new Blob(['\uFEFF' + fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `باركود_المنتجات_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.code || !newProduct.price || !newProduct.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const newBarcode = generateBarcode().toString();
    
    try {
      await createProduct({
        name: newProduct.name,
        code: newProduct.code,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.price) * 0.7,
        stock: 0,
        min_stock: 5,
        barcode: newBarcode,
        is_active: true
      });

      setNewProduct({ name: "", code: "", price: "", category: "" });
      setShowAddProductDialog(false);
      
      toast({
        title: "تم الحفظ",
        description: "تم إضافة المنتج بنجاح مع باركود جديد"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.code || !editingProduct.price || !editingProduct.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        code: editingProduct.code,
        price: editingProduct.price,
        category: editingProduct.category,
        barcode: editingProduct.barcode
      });

      setEditingProduct(null);
      setShowEditProductDialog(false);
      
      toast({
        title: "تم التحديث",
        description: "تم تعديل المنتج بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تعديل المنتج",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (product: BarcodeProduct) => {
    setEditingProduct({ ...product });
    setShowEditProductDialog(true);
  };

  const categories = ["إلكترونيات", "ملابس", "طعام ومشروبات", "منتجات منزلية", "كتب", "أخرى"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cairo text-foreground">إدارة الباركود</h1>
        <div className="flex gap-2">
          <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-cairo">
                <Package className="ml-2 h-4 w-4" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product-name">اسم المنتج *</Label>
                  <Input
                    id="product-name"
                    placeholder="ادخل اسم المنتج"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="product-code">كود المنتج *</Label>
                  <Input
                    id="product-code"
                    placeholder="ادخل كود المنتج"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="product-price">السعر *</Label>
                  <Input
                    id="product-price"
                    type="number"
                    step="0.01"
                    placeholder="ادخل سعر المنتج"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="product-category">الفئة *</Label>
                  <Select 
                    value={newProduct.category} 
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فئة المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddProduct} className="flex-1">
                    إضافة مع باركود
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddProductDialog(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-cairo">
                <Scan className="ml-2 h-4 w-4" />
                مسح الباركود
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>مسح الباركود</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scan-input">رقم الباركود</Label>
                  <Input
                    id="scan-input"
                    placeholder="ادخل رقم الباركود أو استخدم الماسح"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                  />
                </div>
                <Button onClick={handleScanBarcode} className="w-full">
                  <Search className="ml-2 h-4 w-4" />
                  البحث
                </Button>
                {foundProduct && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h3 className="font-semibold text-green-800">تم العثور على المنتج!</h3>
                    <p><strong>الاسم:</strong> {foundProduct.name}</p>
                    <p><strong>الكود:</strong> {foundProduct.code}</p>
                    <p><strong>السعر:</strong> {foundProduct.price} ج.م</p>
                  </div>
                )}
                {scannedCode && !foundProduct && (
                  <div className="p-4 border rounded-lg bg-red-50">
                    <p className="text-red-800">لم يتم العثور على منتج بهذا الباركود</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button className="font-cairo">
                <QrCode className="ml-2 h-4 w-4" />
                إنشاء باركود
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>إنشاء باركود جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <QrCode className="mx-auto h-12 w-12 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-1">إنشاء باركود تلقائي</h3>
                  <p className="text-sm text-blue-700">
                    سيتم إنشاء باركود فريد مكون من 13 رقم لكل منتج
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">المنتجات المحددة:</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {selectedProducts.length} منتج
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">المنتجات بدون باركود:</span>
                    <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {(products || []).filter(p => !p.barcode || p.barcode === "").length} منتج
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    سيتم إنشاء باركود لـ:
                  </p>
                  <div className="space-y-2">
                    {selectedProducts.length > 0 ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✓ المنتجات المحددة ({selectedProducts.length} منتج)
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          → المنتجات التي لا تحتوي على باركود ({(products || []).filter(p => !p.barcode || p.barcode === "").length} منتج)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={async () => {
                    const productsToUpdate = selectedProducts.length > 0 
                      ? (products || []).filter(p => selectedProducts.includes(p.id))
                      : (products || []).filter(p => !p.barcode || p.barcode === "");
                    
                    if (productsToUpdate.length === 0) {
                      toast({
                        title: "تنبيه",
                        description: "لا توجد منتجات للتحديث",
                        variant: "destructive"
                      });
                      return;
                    }

                    try {
                      for (const product of productsToUpdate) {
                        const newBarcode = generateBarcode().toString();
                        await updateProduct(product.id, { barcode: newBarcode });
                      }
                      
                      setShowGenerateDialog(false);
                      setSelectedProducts([]);
                      toast({
                        title: "تم بنجاح",
                        description: `تم إنشاء باركود لـ ${productsToUpdate.length} منتج بنجاح`
                      });
                    } catch (error) {
                      toast({
                        title: "خطأ", 
                        description: "فشل في إنشاء الباركود",
                        variant: "destructive"
                      });
                    }
                  }} className="flex-1">
                    <QrCode className="ml-2 h-4 w-4" />
                    إنشاء الباركود
                  </Button>
                  <Button variant="outline" onClick={() => setShowGenerateDialog(false)} className="flex-1">
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Product Dialog */}
          <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>تعديل المنتج</DialogTitle>
              </DialogHeader>
              {editingProduct && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-product-name">اسم المنتج *</Label>
                    <Input
                      id="edit-product-name"
                      placeholder="ادخل اسم المنتج"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-product-code">كود المنتج *</Label>
                    <Input
                      id="edit-product-code"
                      placeholder="ادخل كود المنتج"
                      value={editingProduct.code}
                      onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-product-price">السعر *</Label>
                    <Input
                      id="edit-product-price"
                      type="number"
                      step="0.01"
                      placeholder="ادخل سعر المنتج"
                      value={editingProduct.price.toString()}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-product-category">الفئة *</Label>
                    <Select 
                      value={editingProduct.category} 
                      onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر فئة المنتج" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-product-barcode">الباركود</Label>
                    <Input
                      id="edit-product-barcode"
                      placeholder="الباركود الحالي"
                      value={editingProduct.barcode}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleEditProduct} className="flex-1">
                      حفظ التعديل
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEditProductDialog(false)}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                تم تحديد {selectedProducts.length} منتج
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={printBarcodes}>
                  <Printer className="ml-2 h-4 w-4" />
                  طباعة الباركود
                </Button>
                <Button variant="outline" onClick={exportBarcodes}>
                  <Download className="ml-2 h-4 w-4" />
                  تصدير الباركود
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">البحث في المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو الكود أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">قائمة المنتجات والباركود</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-tajawal">اسم المنتج</TableHead>
                <TableHead className="font-tajawal">كود المنتج</TableHead>
                <TableHead className="font-tajawal">الباركود</TableHead>
                <TableHead className="font-tajawal">السعر</TableHead>
                <TableHead className="font-tajawal">الفئة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="text-center">
                      <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2 font-cairo">
                        لا توجد منتجات في النظام
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 font-tajawal">
                        ابدأ بإضافة منتجات جديدة لإنشاء الباركود الخاص بها
                      </p>
                      <Button 
                        onClick={() => setShowAddProductDialog(true)}
                        variant="outline"
                        className="font-cairo"
                      >
                        <Package className="ml-2 h-4 w-4" />
                        إضافة منتج جديد
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-tajawal font-medium">{product.name}</TableCell>
                    <TableCell className="font-tajawal">{product.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {product.barcode}
                        </code>
                        <div className="w-16 h-8 bg-black flex items-center justify-center">
                          <div className="flex">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-0.5 h-6 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal">{product.price} ج.م</TableCell>
                    <TableCell className="font-tajawal">{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                          تعديل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateNewBarcode(product.id)}
                        >
                          <Plus className="h-4 w-4" />
                          جديد
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProducts([product.id]);
                            printBarcodes();
                          }}
                        >
                          <Printer className="h-4 w-4" />
                          طباعة
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}