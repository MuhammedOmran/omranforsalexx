import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Mail, 
  Download, 
  Shield, 
  Truck,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  FileText,
  Globe,
  CreditCard,
  Phone
} from 'lucide-react';

export function SalesDistributionGuide() {
  const distributionChannels = [
    {
      name: "البيع المباشر",
      icon: <DollarSign className="h-5 w-5" />,
      description: "البيع المباشر للعملاء",
      steps: [
        "عرض النظام للعميل مع النسخة التجريبية",
        "تحديد احتياجات العميل ونوع الترخيص المناسب",
        "إصدار عرض سعر رسمي",
        "توقيع العقد واستلام الدفعة",
        "إنشاء مفتاح الترخيص وإرساله للعميل"
      ]
    },
    {
      name: "الوكلاء والموزعين",
      icon: <Users className="h-5 w-5" />,
      description: "شبكة الوكلاء المعتمدين",
      steps: [
        "تدريب الوكيل على النظام وطرق البيع",
        "منح الوكيل نسخة عرض خاصة",
        "تحديد منطقة عمل الوكيل والعمولات",
        "تزويد الوكيل بالمواد التسويقية",
        "متابعة أداء الوكيل وتقديم الدعم"
      ]
    },
    {
      name: "المتجر الإلكتروني",
      icon: <Globe className="h-5 w-5" />,
      description: "البيع عبر الإنترنت",
      steps: [
        "إنشاء صفحة منتج جذابة مع فيديو توضيحي",
        "ربط نظام الدفع الإلكتروني",
        "تفعيل التوليد التلقائي للتراخيص",
        "إرسال المفتاح تلقائياً بعد الدفع",
        "تقديم الدعم الفني للعملاء"
      ]
    }
  ];

  const packageTypes = [
    {
      name: "الحزمة الأساسية",
      price: "500 ريال/سنة",
      features: ["3 مستخدمين", "المحاسبة الأساسية", "إدارة المخزون", "التقارير", "النسخ الاحتياطي"],
      target: "الأعمال الصغيرة والمتاجر"
    },
    {
      name: "الحزمة الاحترافية", 
      price: "1500 ريال/سنة",
      features: ["10 مستخدمين", "جميع الميزات", "التقارير المتقدمة", "التكامل مع البنوك", "الدعم المميز"],
      target: "الشركات المتوسطة"
    },
    {
      name: "حزمة المؤسسات",
      price: "3000 ريال/سنة", 
      features: ["50 مستخدم", "تخصيص كامل", "التدريب المجاني", "الدعم المخصص", "SLA متقدم"],
      target: "المؤسسات الكبيرة"
    }
  ];

  const deliveryMethods = [
    {
      method: "البريد الإلكتروني",
      icon: <Mail className="h-5 w-5" />,
      description: "إرسال مفتاح الترخيص عبر البريد الإلكتروني مع التعليمات",
      pros: ["سريع ومباشر", "تكلفة منخفضة", "يمكن تتبعه"],
      cons: ["قد يذهب للرسائل المزعجة", "يحتاج إنترنت للتفعيل"]
    },
    {
      method: "ملف التفعيل",
      icon: <Download className="h-5 w-5" />, 
      description: "إرسال ملف JSON يحتوي على بيانات الترخيص",
      pros: ["يعمل بدون إنترنت", "أكثر أماناً", "سهل الاستخدام"],
      cons: ["حجم أكبر", "يحتاج شرح إضافي"]
    },
    {
      method: "التسليم الشخصي",
      icon: <Truck className="h-5 w-5" />,
      description: "تفعيل النظام شخصياً في مقر العميل",
      pros: ["ضمان التفعيل الصحيح", "تدريب مباشر", "بناء علاقة قوية"],
      cons: ["تكلفة إضافية", "يحتاج وقت أكثر"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* مقدمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            دليل البيع والتوزيع الشامل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              هذا الدليل يوضح كيفية بيع وتوزيع نظام عمران للعملاء بطريقة احترافية مع ضمان تفعيل التراخيص بشكل صحيح.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* قنوات التوزيع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            قنوات التوزيع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {distributionChannels.map((channel, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {channel.icon}
                  <h3 className="font-semibold">{channel.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{channel.description}</p>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">خطوات التنفيذ:</h4>
                  <ol className="text-sm space-y-1">
                    {channel.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-2">
                        <span className="text-primary font-medium">{stepIndex + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* حزم الأسعار */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            حزم الأسعار المقترحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {packageTypes.map((pkg, index) => (
              <div key={index} className="border rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <div className="text-2xl font-bold text-primary mt-2">{pkg.price}</div>
                  <p className="text-sm text-muted-foreground mt-1">{pkg.target}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">المميزات:</h4>
                  <ul className="space-y-1">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* طرق التسليم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            طرق تسليم التراخيص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {deliveryMethods.map((delivery, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {delivery.icon}
                  <h3 className="font-semibold">{delivery.method}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{delivery.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2">المميزات:</h4>
                    <ul className="space-y-1">
                      {delivery.pros.map((pro, proIndex) => (
                        <li key={proIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-2">التحديات:</h4>
                    <ul className="space-y-1">
                      {delivery.cons.map((con, conIndex) => (
                        <li key={conIndex} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* عملية البيع المتكاملة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            عملية البيع المتكاملة (خطوة بخطوة)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: "التسويق والعرض",
                details: ["تحديد العميل المستهدف", "عرض النسخة التجريبية", "شرح المميزات والفوائد", "تحديد الاحتياجات الخاصة"]
              },
              {
                step: "التفاوض والعقد",
                details: ["تحديد نوع الترخيص المناسب", "مناقشة الأسعار والشروط", "إعداد العقد والاتفاقية", "تحديد طريقة الدفع"]
              },
              {
                step: "إنشاء الترخيص",
                details: ["استخدام مولد المفاتيح", "إدخال بيانات العميل", "تحديد فترة الصلاحية", "توليد مفتاح الترخيص"]
              },
              {
                step: "التسليم والتفعيل",
                details: ["إرسال المفتاح للعميل", "تقديم تعليمات التفعيل", "متابعة عملية التفعيل", "تقديم الدعم الفني"]
              },
              {
                step: "المتابعة والدعم",
                details: ["تدريب المستخدمين", "متابعة الاستخدام", "تقديم الدعم المستمر", "تجديد الترخيص عند الانتهاء"]
              }
            ].map((phase, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">{phase.step}</h3>
                  <ul className="space-y-1">
                    {phase.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* نصائح مهمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            نصائح مهمة للنجاح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>أمان التراخيص:</strong><br />
                • احتفظ بسجل لجميع التراخيص المُصدرة<br />
                • لا تشارك مفاتيح الترخيص علناً<br />
                • راقب استخدام التراخيص بانتظام
              </AlertDescription>
            </Alert>

            <Alert>
              <Phone className="h-4 w-4" />
              <AlertDescription>
                <strong>خدمة العملاء:</strong><br />
                • قدم دعماً سريعاً ومتجاوباً<br />
                • أنشئ قاعدة معرفة شاملة<br />
                • تابع رضا العملاء بانتظام
              </AlertDescription>
            </Alert>

            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>التسعير الذكي:</strong><br />
                • قدم خصومات للعملاء الجدد<br />
                • اربط الأسعار بقيمة الخدمة<br />
                • راجع الأسعار دورياً حسب السوق
              </AlertDescription>
            </Alert>

            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>بناء العلاقات:</strong><br />
                • حافظ على تواصل دوري مع العملاء<br />
                • اطلب تقييمات وشهادات<br />
                • استخدم العملاء السعداء للتسويق
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}