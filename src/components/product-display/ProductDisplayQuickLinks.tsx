import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Users, 
  FileText, 
  Package,
  Truck,
  Barcode,
  Boxes,
  Receipt
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductDisplayQuickLinks = memo(() => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: "المبيعات",
      description: "إدارة المبيعات والعملاء",
      icon: ShoppingCart,
      color: "bg-green-500/10 text-green-700 hover:bg-green-500/20",
      links: [
        { 
          label: "فواتير البيع", 
          icon: Receipt, 
          path: "/sales/invoices",
          description: "إنشاء ومتابعة فواتير البيع"
        },
        { 
          label: "العملاء", 
          icon: Users, 
          path: "/sales/customers",
          description: "إدارة بيانات العملاء"
        },
        { 
          label: "تقارير المبيعات", 
          icon: FileText, 
          path: "/reports/sales",
          description: "تقارير وإحصائيات المبيعات"
        }
      ]
    },
    {
      title: "المشتريات",
      description: "إدارة المشتريات والموردين",
      icon: Truck,
      color: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20",
      links: [
        { 
          label: "فواتير الشراء", 
          icon: FileText, 
          path: "/purchases/invoices",
          description: "إنشاء ومتابعة فواتير الشراء"
        },
        { 
          label: "الموردين", 
          icon: Truck, 
          path: "/purchases/suppliers",
          description: "إدارة بيانات الموردين"
        },
        { 
          label: "تقارير المشتريات", 
          icon: FileText, 
          path: "/reports/purchases",
          description: "تقارير وإحصائيات المشتريات"
        }
      ]
    },
    {
      title: "المخزون",
      description: "إدارة المخزون والمنتجات",
      icon: Package,
      color: "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20",
      links: [
        { 
          label: "المخزون الحالي", 
          icon: Boxes, 
          path: "/inventory/stock",
          description: "متابعة الكميات الحالية"
        },
        { 
          label: "إدارة المنتجات", 
          icon: Package, 
          path: "/inventory/products",
          description: "إضافة وتعديل المنتجات"
        },
        { 
          label: "الباركود", 
          icon: Barcode, 
          path: "/inventory/barcode",
          description: "إنشاء وطباعة الباركود"
        }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">الروابط السريعة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <section.icon className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Button
                    key={link.path}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-3 hover:bg-primary/5"
                    onClick={() => navigate(link.path)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <link.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="text-right flex-1">
                        <div className="font-medium text-sm">{link.label}</div>
                        <div className="text-xs text-muted-foreground">{link.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

ProductDisplayQuickLinks.displayName = "ProductDisplayQuickLinks";

export { ProductDisplayQuickLinks };