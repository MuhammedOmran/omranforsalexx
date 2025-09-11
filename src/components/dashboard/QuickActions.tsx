import { Plus, FileText, Package, Users, Scan } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: "primary" | "success" | "warning";
}

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionProps) {
  const navigate = useNavigate();

  const colorClasses = {
    primary: "bg-primary hover:bg-primary-hover text-primary-foreground",
    success: "bg-success hover:bg-success/90 text-success-foreground",
    warning: "bg-warning hover:bg-warning/90 text-warning-foreground",
  };

  return (
    <Card className="group hover:shadow-custom-md transition-all duration-200 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(href)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActions() {
  const actions = [
    {
      title: "فاتورة مبيعات جديدة",
      description: "إنشاء فاتورة مبيعات سريعة",
      icon: FileText,
      href: "/sales/invoices/new",
      color: "primary" as const,
    },
    {
      title: "إضافة منتج جديد",
      description: "إضافة منتج إلى المخزون",
      icon: Package,
      href: "/inventory/products/new",
      color: "success" as const,
    },
    {
      title: "عميل جديد",
      description: "إضافة عميل إلى قاعدة البيانات",
      icon: Users,
      href: "/sales/customers/new",
      color: "primary" as const,
    },
    {
      title: "مسح الباركود",
      description: "مسح منتج بالباركود",
      icon: Scan,
      href: "/inventory/barcode",
      color: "warning" as const,
    },
    {
      title: "فاتورة شراء",
      description: "إنشاء فاتورة شراء جديدة",
      icon: FileText,
      href: "/purchases/invoices",
      color: "warning" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <QuickActionCard key={index} {...action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}