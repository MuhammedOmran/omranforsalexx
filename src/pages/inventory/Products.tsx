import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";

export default function Products() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { invoices, getInvoiceItems } = usePurchaseInvoices();
  const { products, loading, error, updateProduct, deleteProduct, refreshProducts, fetchDeletedProducts, restoreProduct, permanentDeleteProduct, permanentDeleteAllProducts } = useSupabaseProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);
  const [showDeletedProducts, setShowDeletedProducts] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [productInvoices, setProductInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);
  
  const filteredProducts = (products || []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "نفدت الكمية", variant: "destructive" as const };
    if (stock <= minStock) return { label: "كمية قليلة", variant: "secondary" as const };
    return { label: "متوفر", variant: "default" as const };
  };

  const handleEditProduct = async () => {
    if (editingProduct) {
      try {
        await updateProduct(editingProduct.id, {
          name: editingProduct.name,
          price: editingProduct.price,
          cost: editingProduct.cost,
          stock: editingProduct.stock,
          min_stock: editingProduct.min_stock,
          supplier: editingProduct.supplier
        });
        setEditingProduct(null);
        toast({
          title: "نجح",
          description: "تم تحديث المنتج بنجاح"
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في تحديث المنتج",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditInputChange = (field: string, value: string | number) => {
    if (editingProduct) {
      const updatedProduct = { ...editingProduct, [field]: value };
      
      // Only recalculate profit and percentage, NEVER modify the price user entered
      if (field === 'price' || field === 'cost') {
        const price = field === 'price' ? Number(value) : editingProduct.price;
        const cost = field === 'cost' ? Number(value) : editingProduct.cost;
        const profit = price - cost;
        const profitPercentage = cost > 0 ? ((profit / cost) * 100) : 0;
        
        // Only update calculated fields, preserve user input
        updatedProduct.profit = profit;
        updatedProduct.profitPercentage = profitPercentage;
      }
      
      setEditingProduct(updatedProduct);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive"
      });
    }
  };

  const handleShowDeletedProducts = async () => {
    setLoadingDeleted(true);
    try {
      const deletedData = await fetchDeletedProducts();
      setDeletedProducts(deletedData);
      setShowDeletedProducts(true);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في جلب المنتجات المحذوفة",
        variant: "destructive"
      });
    } finally {
      setLoadingDeleted(false);
    }
  };

  const handleRestoreProduct = async (productId: string, productName: string) => {
    try {
      await restoreProduct(productId);
      setDeletedProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "تم الاستعادة",
        description: `تم استعادة المنتج "${productName}" بنجاح`
      });
      refreshProducts();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في استعادة المنتج",
        variant: "destructive"
      });
    }
  };

  const handlePermanentDeleteProduct = async (productId: string, productName: string) => {
    try {
      await permanentDeleteProduct(productId);
      setDeletedProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "تم الحذف النهائي",
        description: `تم حذف المنتج "${productName}" نهائياً`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في الحذف النهائي للمنتج",
        variant: "destructive"
      });
    }
  };

  const handlePermanentDeleteAllProducts = async () => {
    try {
      await permanentDeleteAllProducts();
      setDeletedProducts([]);
      toast({
        title: "نجح الحذف",
        description: "تم حذف جميع المنتجات المحذوفة نهائياً"
      });
    } catch (error) {
      toast({
        title: "خطأ", 
        description: "فشل في حذف جميع المنتجات نهائياً",
        variant: "destructive"
      });
    }
  };

  const handleViewProduct = async (product: any) => {
    setSelectedProduct(product);
    setLoadingInvoices(true);
    setShowProductDetails(true);
    
    // البحث عن الفواتير التي تحتوي على هذا المنتج
    try {
      const relatedInvoices = [];
      
      for (const invoice of invoices) {
        const items = await getInvoiceItems(invoice.id);
        const hasProduct = items.some(item => 
          item.product_name.toLowerCase().includes(product.name.toLowerCase()) ||
          item.product_id === product.id
        );
        
        if (hasProduct) {
          relatedInvoices.push({
            ...invoice,
            items: items.filter(item => 
              item.product_name.toLowerCase().includes(product.name.toLowerCase()) ||
              item.product_id === product.id
            )
          });
        }
      }
      
      setProductInvoices(relatedInvoices);
    } catch (error) {
      console.error('Error loading product invoices:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل فواتير المنتج",
        variant: "destructive"
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cairo text-foreground">إدارة المنتجات</h1>
        <div className="flex gap-2">
          <Button onClick={refreshProducts} variant="outline" className="font-cairo">
            <RotateCcw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => navigate('/inventory/products/new')} className="font-cairo">
            <Plus className="ml-2 h-4 w-4" />
            إضافة منتج جديد
          </Button>
          <Button variant="destructive" onClick={handleShowDeletedProducts} disabled={loadingDeleted} className="font-cairo">
            <RotateCcw className="ml-2 h-4 w-4" />
            {loadingDeleted ? "جار التحميل..." : "استعادة المنتجات المحذوفة"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <Package className="h-5 w-5" />
            قائمة المنتجات
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جار التحميل...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">خطأ: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-tajawal">اسم المنتج</TableHead>
                  <TableHead className="font-tajawal">الكود</TableHead>
                  <TableHead className="font-tajawal">الفئة</TableHead>
                  <TableHead className="font-tajawal">الكمية</TableHead>
                  <TableHead className="font-tajawal">الحالة</TableHead>
                  <TableHead className="font-tajawal">سعر البيع</TableHead>
                  <TableHead className="font-tajawal">الحالة</TableHead>
                  <TableHead className="font-tajawal">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredProducts.map((product) => {
                   const stockStatus = getStockStatus(product.stock, product.min_stock || 0);
                   return (
                     <TableRow key={product.id}>
                       <TableCell className="font-medium font-tajawal">{product.name}</TableCell>
                       <TableCell className="font-tajawal">{product.code}</TableCell>
                       <TableCell className="font-tajawal">{product.category || 'غير محدد'}</TableCell>
                        <TableCell className="font-tajawal">{product.stock}</TableCell>
                         <TableCell>
                          <Badge variant={stockStatus.variant} className="font-tajawal">
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                       <TableCell className="font-tajawal">{product.price} ج.م</TableCell>
                       <TableCell>
                         <Badge variant={product.is_active ? "default" : "secondary"} className="font-tajawal">
                           {product.is_active ? "نشط" : "غير نشط"}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              title="عرض تفاصيل المنتج والفواتير"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const profit = (product.price || 0) - (product.cost || 0);
                                const profitPercentage = (product.cost || 0) > 0 ? ((profit / (product.cost || 0)) * 100) : 0;
                                setEditingProduct({
                                  ...product,
                                  profit,
                                  profitPercentage
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-cairo">تعديل المنتج</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="font-tajawal">اسم المنتج</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => handleEditInputChange("name", e.target.value)}
                    className="font-tajawal"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock" className="font-tajawal">الكمية الحالية</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => handleEditInputChange("stock", Number(e.target.value))}
                    className="font-tajawal"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price" className="font-tajawal">سعر البيع</Label>
                  <div className="relative">
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => handleEditInputChange("price", Number(e.target.value))}
                      className="font-tajawal"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-tajawal">ج.م</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-cost" className="font-tajawal">سعر التكلفة</Label>
                  <div className="relative">
                    <Input
                      id="edit-cost"
                      type="number"
                      value={editingProduct.cost}
                      onChange={(e) => handleEditInputChange("cost", Number(e.target.value))}
                      className="font-tajawal"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-tajawal">ج.م</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-min-stock" className="font-tajawal">الحد الأدنى للمخزون</Label>
                <Input
                  id="edit-min-stock"
                  type="number"
                  value={editingProduct.min_stock || 0}
                  onChange={(e) => handleEditInputChange("min_stock", Number(e.target.value))}
                  className="font-tajawal"
                />
              </div>

              <div>
                <Label htmlFor="edit-supplier" className="font-tajawal">المورد</Label>
                <Select 
                  value={editingProduct.supplier || "none"} 
                  onValueChange={(value) => handleEditInputChange("supplier", value === "none" ? null : value)}
                >
                  <SelectTrigger className="font-tajawal">
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="none" className="font-tajawal">غير محدد</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name} className="font-tajawal">
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-profit" className="font-tajawal">ربح المنتج</Label>
                  <div className="relative">
                    <Input
                      id="edit-profit"
                      type="number"
                      value={(editingProduct.profit || 0).toFixed(2)}
                      readOnly
                      className="bg-muted font-tajawal"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-tajawal">ج.م</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-profit-percentage" className="font-tajawal">نسبة الربح</Label>
                  <div className="relative">
                    <Input
                      id="edit-profit-percentage"
                      type="number"
                      value={(editingProduct.profitPercentage || 0).toFixed(2)}
                      readOnly
                      className="bg-muted font-tajawal"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-tajawal">%</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleEditProduct} className="w-full font-cairo">
                حفظ التغييرات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deleted Products Dialog */}
      <Dialog open={showDeletedProducts} onOpenChange={setShowDeletedProducts}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">المنتجات المحذوفة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deletedProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-cairo">
                لا توجد منتجات محذوفة
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-cairo">
                  عدد المنتجات المحذوفة: {deletedProducts.length}
                </p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-tajawal">اسم المنتج</TableHead>
                        <TableHead className="font-tajawal">الكود</TableHead>
                        <TableHead className="font-tajawal">الفئة</TableHead>
                        <TableHead className="font-tajawal">السعر</TableHead>
                        <TableHead className="font-tajawal">الكمية</TableHead>
                        <TableHead className="font-tajawal">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium font-tajawal">{product.name}</TableCell>
                          <TableCell className="font-tajawal">{product.code}</TableCell>
                          <TableCell className="font-tajawal">{product.category || 'غير محدد'}</TableCell>
                          <TableCell className="font-tajawal">{product.price} ج.م</TableCell>
                          <TableCell className="font-tajawal">{product.stock}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRestoreProduct(product.id, product.name)}
                                className="font-cairo"
                              >
                                <RotateCcw className="h-4 w-4 ml-2" />
                                استعادة
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="font-cairo"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف نهائي
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-cairo">تأكيد الحذف النهائي</AlertDialogTitle>
                                    <AlertDialogDescription className="font-cairo">
                                      هل أنت متأكد من أنك تريد حذف المنتج "{product.name}" نهائياً؟ 
                                      هذا الإجراء لا يمكن التراجع عنه.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handlePermanentDeleteProduct(product.id, product.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-cairo"
                                    >
                                      حذف نهائي
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-6">
              {deletedProducts.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف جميع المنتجات المحذوفة نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                      handlePermanentDeleteAllProducts();
                    }
                  }}
                  className="font-cairo"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف جميع المنتجات نهائياً
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowDeletedProducts(false)}
                className="font-cairo"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">تفاصيل المنتج والفواتير</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-cairo">معلومات المنتج</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="font-tajawal">اسم المنتج</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">الكود</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.code}</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">الفئة</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.category || 'غير محدد'}</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">الكمية الحالية</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.stock}</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">سعر البيع</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.price} ج.م</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">سعر التكلفة</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.cost} ج.م</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">الحد الأدنى</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.min_stock}</p>
                    </div>
                    <div>
                      <Label className="font-tajawal">المورد</Label>
                      <p className="text-sm font-medium mt-1 font-tajawal">{selectedProduct.supplier || 'غير محدد'}</p>
                    </div>
                  </div>
                  {selectedProduct.description && (
                    <div className="mt-4">
                      <Label className="font-tajawal">الوصف</Label>
                      <p className="text-sm mt-1 font-tajawal">{selectedProduct.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-cairo">فواتير الشراء المرتبطة</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="text-center py-4">جار تحميل الفواتير...</div>
                  ) : productInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد فواتير مرتبطة بهذا المنتج
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground font-cairo">
                        عدد الفواتير: {productInvoices.length}
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-tajawal">رقم الفاتورة</TableHead>
                            <TableHead className="font-tajawal">المورد</TableHead>
                            <TableHead className="font-tajawal">التاريخ</TableHead>
                            <TableHead className="font-tajawal">الكمية</TableHead>
                            <TableHead className="font-tajawal">سعر الوحدة</TableHead>
                            <TableHead className="font-tajawal">الإجمالي</TableHead>
                            <TableHead className="font-tajawal">الحالة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productInvoices.map((invoice) => (
                            invoice.items.map((item: any, index: number) => (
                              <TableRow key={`${invoice.id}-${index}`}>
                                <TableCell className="font-tajawal">{invoice.invoice_number}</TableCell>
                                <TableCell className="font-tajawal">{invoice.supplier_name}</TableCell>
                                <TableCell className="font-tajawal">
                                  {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}
                                </TableCell>
                                <TableCell className="font-tajawal">{item.quantity}</TableCell>
                                <TableCell className="font-tajawal">{item.unit_cost} ج.م</TableCell>
                                <TableCell className="font-tajawal">{item.total_cost} ج.م</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    invoice.status === 'paid' ? 'default' :
                                    invoice.status === 'pending' ? 'secondary' :
                                    invoice.status === 'overdue' ? 'destructive' : 'outline'
                                  }>
                                    {invoice.status === 'paid' ? 'مدفوع' :
                                     invoice.status === 'pending' ? 'معلق' :
                                     invoice.status === 'overdue' ? 'متأخر' : 'ملغي'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}