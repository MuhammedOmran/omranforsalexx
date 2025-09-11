import { memo, useState, useCallback } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Copy, QrCode, Clock, Eye } from "lucide-react";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  views: number;
  maxViews?: number;
  name: string;
}

const ProductDisplayShareDialog = memo(() => {
  const { filteredProducts, displayOption } = useProductDisplay();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [linkName, setLinkName] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxViews, setMaxViews] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  // تحميل الروابط الموجودة عند فتح الحوار
  const loadExistingLinks = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('shared_products')
        .select('*')
        .eq('creator_user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading existing links:', error);
        return;
      }

      const links = data?.map(item => ({
        id: item.share_id,
        url: `${window.location.origin}/shared-products/${item.share_id}`,
        expiresAt: new Date(item.expires_at),
        views: item.views || 0,
        maxViews: item.max_views,
        name: item.name
      })) || [];

      setShareLinks(links);
    } catch (error) {
      console.error('Error loading links:', error);
    }
  }, []);

  // تحميل الروابط عند فتح الحوار
  React.useEffect(() => {
    if (isOpen) {
      loadExistingLinks();
    }
  }, [isOpen, loadExistingLinks]);

  const generateShareLink = useCallback(async () => {
    setLoading(true);
    if (!linkName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للرابط",
        variant: "destructive"
      });
      return;
    }

    if (!filteredProducts || filteredProducts.length === 0) {
      toast({
        title: "تحذير",
        description: "لا توجد منتجات لمشاركتها",
        variant: "destructive"
      });
      return;
    }

    const shareId = crypto.randomUUID();
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared-products/${shareId}`;
    
    try {
      // حفظ البيانات في Supabase
      const { data: user } = await supabase.auth.getUser();
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('shared_products')
        .insert({
          share_id: shareId,
          name: linkName,
          products: JSON.parse(JSON.stringify(filteredProducts.length > 0 ? filteredProducts : [])),
          display_option: displayOption,
          creator_user_id: user.user?.id,
          expires_at: expiresAt.toISOString(),
          max_views: maxViews || null,
          views: 0
        });

      if (error) {
        console.error('Error saving share data:', error);
        toast({
          title: "خطأ",
          description: "فشل في إنشاء رابط المشاركة",
          variant: "destructive"
        });
        return;
      }

      const newLink: ShareLink = {
        id: shareId,
        url: shareUrl,
        expiresAt,
        views: 0,
        maxViews,
        name: linkName
      };

      setShareLinks(prev => [...prev, newLink]);
      setLinkName("");
      setMaxViews(undefined);

      // نسخ الرابط تلقائياً
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "تم إنشاء الرابط",
        description: "تم إنشاء رابط المشاركة ونسخه للحافظة"
      });
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء رابط المشاركة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filteredProducts, displayOption, linkName, expiryHours, maxViews, toast]);

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في نسخ الرابط",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteLink = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('shared_products')
        .delete()
        .eq('share_id', linkId);

      if (error) {
        console.error('Error deleting share:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف رابط المشاركة",
          variant: "destructive"
        });
        return;
      }

      setShareLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: "تم الحذف",
        description: "تم حذف رابط المشاركة"
      });
    } catch (error) {
      console.error('Error deleting share link:', error);
      toast({
        title: "خطأ", 
        description: "فشل في حذف رابط المشاركة",
        variant: "destructive"
      });
    }
  }, [toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="w-4 h-4 ml-2" />
          مشاركة القائمة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>مشاركة قائمة المنتجات</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* إنشاء رابط جديد */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">إنشاء رابط مشاركة جديد</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkName">اسم الرابط</Label>
                  <Input
                    id="linkName"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="مثل: قائمة أسعار يناير 2024"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryHours">انتهاء الصلاحية (ساعة)</Label>
                  <Input
                    id="expiryHours"
                    type="number"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    min="1"
                    max="8760"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxViews">الحد الأقصى للمشاهدات (اختياري)</Label>
                <Input
                  id="maxViews"
                  type="number"
                  value={maxViews || ""}
                  onChange={(e) => setMaxViews(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="غير محدود"
                  min="1"
                />
              </div>

              <Button onClick={generateShareLink} className="w-full" disabled={loading}>
                {loading ? "جاري الإنشاء..." : "إنشاء رابط المشاركة"}
              </Button>
            </CardContent>
          </Card>

          {/* قائمة الروابط المنشأة */}
          {shareLinks.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">الروابط المنشأة</h3>
                <div className="space-y-3">
                  {shareLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{link.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLink(link.id)}
                          className="text-destructive"
                        >
                          حذف
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>ينتهي: {link.expiresAt.toLocaleDateString('en-GB')} - {link.expiresAt.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</span>
                        <Eye className="w-4 h-4 mr-2" />
                        <span>{link.views} مشاهدة</span>
                        {link.maxViews && <span>/ {link.maxViews}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          value={link.url}
                          readOnly
                          className="flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.url)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* معلومات الرابط الحالي */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">معلومات القائمة الحالية</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>عدد المنتجات: {filteredProducts.length}</p>
                <p>نوع العرض: {
                  displayOption === "selling" ? "أسعار البيع" :
                  displayOption === "purchase" ? "أسعار الشراء" : "الكميات المتاحة"
                }</p>
                <p>تاريخ الإنشاء: {new Date().toLocaleDateString('en-GB')} - {new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ProductDisplayShareDialog.displayName = "ProductDisplayShareDialog";

export { ProductDisplayShareDialog };