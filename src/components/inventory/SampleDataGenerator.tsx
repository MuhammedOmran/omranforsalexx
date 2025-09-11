import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inventoryManager } from "@/utils/inventoryUtils";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";

export function SampleDataGenerator() {
  const { toast } = useToast();

  const generateSampleData = () => {
    try {
      // منتجات تجريبية متنوعة للعرض
      const sampleProducts = [
        {
          id: 'prod-001',
          name: 'جهاز كمبيوتر محمول HP',
          price: 2500,
          cost: 2000,
          quantity: 15,
          minQuantity: 3,
          category: 'إلكترونيات',
          barcode: '1234567890001',
          description: 'جهاز كمبيوتر محمول HP Core i5 8GB RAM',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-002', 
          name: 'طاولة مكتب خشبية',
          price: 800,
          cost: 600,
          quantity: 8,
          minQuantity: 2,
          category: 'أثاث',
          barcode: '1234567890002',
          description: 'طاولة مكتب خشبية فاخرة بتصميم عصري',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-003',
          name: 'قلم حبر أزرق',
          price: 5,
          cost: 3,
          quantity: 200,
          minQuantity: 50,
          category: 'قرطاسية',
          barcode: '1234567890003',
          description: 'قلم حبر أزرق عالي الجودة',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-004',
          name: 'شاشة LCD 24 بوصة',
          price: 650,
          cost: 500,
          quantity: 12,
          minQuantity: 3,
          category: 'إلكترونيات',
          barcode: '1234567890004',
          description: 'شاشة LCD عالية الدقة 24 بوصة',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'prod-005',
          name: 'كتاب إدارة الأعمال',
          price: 85,
          cost: 60,
          quantity: 25,
          minQuantity: 5,
          category: 'كتب',
          barcode: '1234567890005',
          description: 'كتاب متخصص في إدارة الأعمال والمشاريع',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // عملاء تجريبيون
      const sampleCustomers = [
        {
          id: 'cust-001',
          name: 'أحمد محمد علي',
          email: 'ahmed@company.com',
          phone: '0501234567',
          address: 'الرياض، حي النخيل',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-002',
          name: 'شركة الصفوة للتجارة',
          email: 'info@alsafwa.com',
          phone: '0112345678',
          address: 'جدة، شارع التحلية',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-003',
          name: 'فاطمة حسن محمود',
          email: 'fatma@outlook.com',
          phone: '0551234567',
          address: 'الدمام، حي الشاطئ',
          createdAt: new Date().toISOString()
        }
      ];

      // موردون تجريبيون  
      const sampleSuppliers = [
        {
          id: 'supp-001',
          name: 'شركة التقنية المتقدمة',
          email: 'sales@tech-advance.com',
          phone: '0114567890',
          address: 'الرياض، حي العليا',
          rating: 4.5,
          createdAt: new Date().toISOString()
        },
        {
          id: 'supp-002',
          name: 'مصنع الأثاث الحديث',
          email: 'orders@modern-furniture.com',
          phone: '0123456789',
          address: 'الدمام، المنطقة الصناعية',
          rating: 4.2,
          createdAt: new Date().toISOString()
        }
      ];

      // حفظ البيانات
      localStorage.setItem('products', JSON.stringify(sampleProducts));
      localStorage.setItem('customers', JSON.stringify(sampleCustomers));  
      localStorage.setItem('suppliers', JSON.stringify(sampleSuppliers));

      toast({
        title: "تم إنشاء البيانات التجريبية",
        description: `تم إضافة ${sampleProducts.length} منتجات، ${sampleCustomers.length} عملاء، ${sampleSuppliers.length} موردين، وفاتورة تجريبية`,
        variant: "default"
      });

      // إعادة تحميل الصفحة لعرض البيانات الجديدة
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('خطأ في إنشاء البيانات التجريبية:', error);
      toast({
        title: "فشل إنشاء البيانات",
        description: "حدث خطأ أثناء إنشاء البيانات التجريبية",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          بيانات تجريبية للاختبار
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          انقر على الزر أدناه لإضافة بيانات تجريبية (منتجات وحركات مخزون) لاختبار النظام
        </p>
        <Button onClick={generateSampleData} variant="outline">
          إنشاء بيانات تجريبية
        </Button>
      </CardContent>
    </Card>
  );
}