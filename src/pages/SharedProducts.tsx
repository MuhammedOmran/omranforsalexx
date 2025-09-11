import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProductDisplayTable } from "@/components/product-display/ProductDisplayTable";
import { ProductDisplayProvider } from "@/contexts/ProductDisplayContext";
import { SEO } from "@/components/SEO/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SharedProducts = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [shareData, setShareData] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadShareData = async () => {
      if (!shareId) return;
      
      try {
        const { data, error } = await supabase
          .from('shared_products')
          .select('*')
          .eq('share_id', shareId)
          .maybeSingle();

        if (error || !data) {
          console.error('Error loading share data:', error);
          setShareData(null);
          setIsLoading(false);
          return;
        }

        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        if (now > expiresAt || (data.max_views && data.views >= data.max_views)) {
          setIsExpired(true);
        } else {
          // زيادة عدد المشاهدات
          const { error: updateError } = await supabase
            .from('shared_products')
            .update({ views: data.views + 1 })
            .eq('share_id', shareId);

          if (updateError) {
            console.error('Error updating view count:', updateError);
          }

          setShareData({
            ...data,
            views: data.views + 1
          });
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المشاركة:', error);
        setShareData(null);
      }
      
      setIsLoading(false);
    };

    loadShareData();
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">جاري تحميل البيانات</h3>
            <p className="text-muted-foreground">يرجى الانتظار بينما نقوم بتحميل قائمة المنتجات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold mb-4 text-red-600">انتهت صلاحية الرابط</h2>
            <p className="text-muted-foreground mb-4">هذا الرابط لم يعد صالحاً للاستخدام أو تم استنفاد عدد المشاهدات المسموحة</p>
            <div className="text-sm text-muted-foreground">
              <p>للحصول على رابط جديد، يرجى التواصل مع منشئ القائمة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData || !shareData.products || shareData.products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="text-center py-8">
            <div className="text-yellow-500 text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-4 text-yellow-600">رابط غير صحيح</h2>
            <p className="text-muted-foreground mb-4">لم يتم العثور على البيانات المطلوبة أو أن الرابط غير صحيح</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              إعادة تحميل الصفحة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={shareData.name || "قائمة منتجات مشتركة"}
        description={`قائمة منتجات تحتوي على ${shareData.products?.length || 0} منتج - ${shareData.displayOption === "selling" ? "أسعار البيع" : shareData.displayOption === "purchase" ? "أسعار الشراء" : "كميات المخزون"}`}
        keywords="قائمة منتجات, أسعار, مخزون, مبيعات"
      />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 space-y-6" dir="rtl">
      {/* معلومات القائمة */}
      <div className="container mx-auto max-w-6xl">
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
            <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">{shareData.name}</h1>
                <p className="text-muted-foreground text-sm">
                  {shareData.display_option === "selling" ? "قائمة أسعار البيع" :
                   shareData.display_option === "purchase" ? "قائمة أسعار الشراء" : "قائمة الكميات المتاحة"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {shareData.products?.length || 0} منتج
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {shareData.views || 0} مشاهدة
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-4 h-4 text-primary" />
                <span>تم إنشاؤه: {new Date(shareData.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <span className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                <span>نوع العرض: {
                  shareData.display_option === "selling" ? "أسعار البيع" :
                  shareData.display_option === "purchase" ? "أسعار الشراء" : "الكميات المتاحة"
                }</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <span className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></span>
                <span>ينتهي: {new Date(shareData.expires_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => window.print()} variant="outline">
                🖨️ طباعة
              </Button>
            </div>
          </CardContent>
        </Card>
      
        {/* عرض المنتجات في جدول منظم */}
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
            <CardTitle className="flex items-center justify-between">
              <span>قائمة المنتجات</span>
              <Badge variant="secondary">{shareData.products?.length || 0} منتج</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                    <th className="text-right p-4 font-semibold text-primary">اسم المنتج</th>
                    <th className="text-center p-4 font-semibold text-primary">الفئة</th>
                    <th className="text-center p-4 font-semibold text-primary">
                      {shareData.display_option === "selling" && "سعر البيع"}
                      {shareData.display_option === "purchase" && "سعر الشراء"}
                      {shareData.display_option === "stock" && "الباركود"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shareData.products.map((product: any, index: number) => (
                    <tr key={product.id || index} className={`border-b hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/10' : 'bg-background'}`}>
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="text-xs">
                          {product.category || "غير محدد"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {shareData.display_option === "selling" && (
                          <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full">{product.price?.toLocaleString() || 0} ج.م</span>
                        )}
                        {shareData.display_option === "purchase" && (
                          <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{product.cost?.toLocaleString() || 0} ج.م</span>
                        )}
                        {shareData.display_option === "stock" && (
                          <code className="text-muted-foreground bg-muted px-2 py-1 rounded text-sm">{product.barcode || "غير محدد"}</code>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default SharedProducts;