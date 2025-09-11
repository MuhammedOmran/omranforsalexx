import { ReactNode, useState } from 'react';
import { HelpCircle, X, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  title: string;
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  className?: string;
  children?: ReactNode;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function HelpTooltip({ 
  title, 
  content, 
  placement = 'top',
  trigger = 'hover',
  className,
  children,
  showIcon = true,
  size = 'md'
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96'
  };

  const IconComponent = children || (
    showIcon && <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-auto p-1 hover:bg-transparent", className)}
          onMouseEnter={trigger === 'hover' ? () => setIsOpen(true) : undefined}
          onMouseLeave={trigger === 'hover' ? () => setIsOpen(false) : undefined}
          onClick={trigger === 'click' ? () => setIsOpen(!isOpen) : undefined}
        >
          {IconComponent}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("p-0 border-0 shadow-lg", sizeClasses[size])}
        side={placement}
        align="center"
      >
        <div className="bg-background border rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <h4 className="font-medium text-sm">{title}</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-3">
            <div className="text-sm text-muted-foreground">
              {content}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// مكونات مساعدة محددة
export function FieldHelp({ label, description, tips }: {
  label: string;
  description: string;
  tips?: string[];
}) {
  return (
    <HelpTooltip
      title={label}
      content={
        <div className="space-y-3">
          <p>{description}</p>
          {tips && tips.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">نصائح:</p>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    <span className="text-xs">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
      size="lg"
    />
  );
}

export function FeatureHelp({ title, steps }: {
  title: string;
  steps: { title: string; description: string }[];
}) {
  return (
    <HelpTooltip
      title={title}
      content={
        <div className="space-y-3">
          <p className="text-sm font-medium">كيفية الاستخدام:</p>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <div className="space-y-1">
                  <p className="font-medium text-xs">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      }
      size="lg"
      trigger="click"
    />
  );
}

// قاموس النصائح
export const helpTexts = {
  product: {
    sku: {
      label: "رمز المنتج (SKU)",
      description: "رمز فريد لتمييز المنتج في النظام",
      tips: [
        "استخدم أرقام وحروف إنجليزية فقط",
        "تجنب المسافات والرموز الخاصة",
        "اجعله قصيراً وسهل التذكر (مثل: LAPTOP001)"
      ]
    },
    barcode: {
      label: "الباركود",
      description: "الرمز الشريطي للمنتج لسهولة المسح والبحث",
      tips: [
        "يمكن مسحه باستخدام ماسح الباركود",
        "إذا لم يكن متوفراً، يمكن تركه فارغاً",
        "يجب أن يكون فريداً لكل منتج"
      ]
    },
    minStock: {
      label: "الحد الأدنى للمخزون",
      description: "أقل كمية مطلوبة في المخزون قبل التحذير من النفاد",
      tips: [
        "حدد الرقم بناءً على معدل البيع",
        "اعتبر وقت توريد المنتج",
        "راجع هذا الرقم بشكل دوري"
      ]
    }
  },
  invoice: {
    discount: {
      label: "الخصم",
      description: "خصم يُطبق على المنتج أو الفاتورة كاملة",
      tips: [
        "يمكن إدخاله كنسبة مئوية أو مبلغ ثابت",
        "الخصم على المنتج يُطبق على ذلك المنتج فقط",
        "الخصم العام يُطبق على إجمالي الفاتورة"
      ]
    },
    tax: {
      label: "الضريبة",
      description: "ضريبة القيمة المضافة أو أي ضرائب أخرى",
      tips: [
        "القيمة الافتراضية هي 15% (ضريبة القيمة المضافة)",
        "يمكن تخصيص النسبة حسب نوع المنتج",
        "تُحسب تلقائياً عند إدخال المنتجات"
      ]
    }
  },
  customer: {
    phone: {
      label: "رقم الهاتف",
      description: "رقم هاتف العميل للتواصل",
      tips: [
        "ابدأ برمز الدولة (مثل: +966)",
        "تأكد من صحة الرقم للتواصل",
        "يمكن استخدامه في الرسائل النصية"
      ]
    },
    creditLimit: {
      label: "حد الائتمان",
      description: "أقصى مبلغ يمكن للعميل الشراء به بالآجل",
      tips: [
        "حدده بناءً على تاريخ العميل في السداد",
        "راجعه بشكل دوري",
        "صفر يعني عدم السماح بالشراء بالآجل"
      ]
    }
  },
  reports: {
    dateRange: {
      label: "فترة التقرير",
      description: "المدة الزمنية التي يغطيها التقرير",
      tips: [
        "اختر فترة مناسبة لنوع التحليل",
        "التقارير اليومية للمتابعة السريعة",
        "التقارير الشهرية للتحليل الاستراتيجي"
      ]
    }
  }
};

// Hook لاستخدام النصائح
export function useHelpTooltips() {
  const getProductHelp = (field: keyof typeof helpTexts.product) => {
    return helpTexts.product[field];
  };

  const getInvoiceHelp = (field: keyof typeof helpTexts.invoice) => {
    return helpTexts.invoice[field];
  };

  const getCustomerHelp = (field: keyof typeof helpTexts.customer) => {
    return helpTexts.customer[field];
  };

  const getReportsHelp = (field: keyof typeof helpTexts.reports) => {
    return helpTexts.reports[field];
  };

  return {
    getProductHelp,
    getInvoiceHelp,
    getCustomerHelp,
    getReportsHelp,
    helpTexts
  };
}