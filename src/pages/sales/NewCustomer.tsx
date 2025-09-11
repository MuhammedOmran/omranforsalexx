import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Save, UserPlus, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/contexts/CustomerContext";

export default function NewCustomer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addCustomer, customers } = useCustomers();

  // Egyptian governorates list
  const egyptianGovernorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", 
    "الفيوم", "الغربية", "الإسماعيلية", "المنيا", "المنوفية", "الوادي الجديد", 
    "شمال سيناء", "جنوب سيناء", "بورسعيد", "السويس", "أسوان", "أسيوط", 
    "بني سويف", "دمياط", "قنا", "كفر الشيخ", "مطروح", "الأقصر", "سوهاج"
  ];

  // Egyptian centers by governorate
  const egyptianCenters: Record<string, string[]> = {
    "القاهرة": ["مدينة نصر", "المعادي", "الزمالك", "المقطم", "التجمع الخامس", "الرحاب", "الشروق", "حلوان", "المطرية", "شبرا الخيمة"],
    "الجيزة": ["الهرم", "فيصل", "الدقي", "المهندسين", "الشيخ زايد", "أكتوبر", "أبو النمرس", "الباويطي", "الواحات البحرية"],
    "الإسكندرية": ["محطة الرمل", "سيدي بشر", "المنتزه", "الأنفوشي", "الورديان", "السيوف", "المعمورة", "أبو قير", "الحضرة"],
    "الدقهلية": ["المنصورة", "طلخا", "دكرنس", "أجا", "بلقاس", "السنبلاوين", "منية النصر", "الكردي", "تمي الأمديد"],
    "البحر الأحمر": ["الغردقة", "رأس غارب", "مرسى علم", "سفاجا", "القصير", "الشلاتين", "حلايب"],
    "البحيرة": ["دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو حمص", "الرحمانية", "شبراخيت", "كوم حمادة"],
    "الفيوم": ["الفيوم", "طامية", "سنورس", "إطسا", "إبشواي", "يوسف الصديق"],
    "الغربية": ["طنطا", "المحلة الكبرى", "كفر الزيات", "السنطة", "قطور", "بسيون", "زفتى"],
    "الإسماعيلية": ["الإسماعيلية", "أبو صوير", "القنطرة شرق", "القنطرة غرب", "فايد", "القصاصين", "التل الكبير"],
    "المنيا": ["المنيا", "ملوي", "سمالوط", "مطاي", "بني مزار", "مغاغة", "أبو قرقاص", "العدوة"],
    "المنوفية": ["شبين الكوم", "منوف", "سرس الليان", "أشمون", "الباجور", "قويسنا", "السادات"],
    "الوادي الجديد": ["الخارجة", "الداخلة", "الفرافرة", "باريس", "موط", "القصر"],
    "شمال سيناء": ["العريش", "الشيخ زويد", "رفح", "بئر العبد", "الحسنة", "نخل"],
    "جنوب سيناء": ["شرم الشيخ", "دهب", "نويبع", "طابا", "كاترين", "أبو رديس", "الطور"],
    "بورسعيد": ["بورسعيد", "بورفؤاد", "الضواحي", "المناخ", "الجنوب"],
    "السويس": ["السويس", "الجناين", "فيصل", "السلام", "عتاقة"],
    "أسوان": ["أسوان", "كوم أمبو", "إدفو", "أسوان الجديدة", "نصر النوبة", "الكلابشة"],
    "أسيوط": ["أسيوط", "ديروط", "منفلوط", "القوصية", "أبنوب", "ساحل سليم", "الفتح"],
    "بني سويف": ["بني سويف", "الواسطى", "ناصر", "إهناسيا", "سمسطا", "ببا"],
    "دمياط": ["دمياط", "رأس البر", "الزرقا", "فارسكور", "الروضة", "كفر البطيخ"],
    "قنا": ["قنا", "الوقف", "نجع حمادي", "دشنا", "قفط", "فرشوط", "قوص"],
    "كفر الشيخ": ["كفر الشيخ", "دسوق", "فوة", "قلين", "سيدي سالم", "الحامول", "بلطيم"],
    "مطروح": ["مطروح", "الحمام", "الضبعة", "العلمين", "سيدي براني", "سلوم", "النجيلة"],
    "الأقصر": ["الأقصر", "إسنا", "الأقصر الجديدة", "البياضية", "الطود", "أرمنت"],
    "سوهاج": ["سوهاج", "جرجا", "أخميم", "البلينا", "المراغة", "طما", "جهينة", "ساقلتة"]
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    center: "",
    country: "مصر",
    customerType: "individual", // individual or company
    taxNumber: "",
    paymentOption: "immediate", // immediate or installment
    debtLimit: "",
    openingBalanceDebit: "",
    openingBalanceCredit: "",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerAdditionDate, setCustomerAdditionDate] = useState("");
  const [showOpeningBalance, setShowOpeningBalance] = useState(false);
  const [customerNumber, setCustomerNumber] = useState("");

  // Initialize customer addition date and generate customer number
  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    setCustomerAdditionDate(formattedDate);

    // Generate customer number automatically
    const nextNumber = customers.length + 1;
    const generatedCustomerNumber = `CS-${nextNumber}`;
    setCustomerNumber(generatedCustomerNumber);
  }, [customers]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear city and center when country changes
    if (field === "country") {
      setFormData(prev => ({ ...prev, [field]: value, city: "", center: "" }));
    }
    
    // Clear center when city changes
    if (field === "city") {
      setFormData(prev => ({ ...prev, [field]: value, center: "" }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "اسم العميل مطلوب";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^[\+]?[0-9\-\s\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "رقم الهاتف غير صحيح";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (formData.customerType === "company" && !formData.taxNumber.trim()) {
      newErrors.taxNumber = "الرقم الضريبي مطلوب للشركات";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى تصحيح الأخطاء قبل الحفظ",
        variant: "destructive",
      });
      return;
    }

    try {
      // إنشاء عنوان مجمع يتضمن جميع المعلومات
      const fullAddress = [
        formData.address,
        formData.center,
        formData.city,
        formData.country
      ].filter(Boolean).join(', ');

      // إنشاء ملاحظات تتضمن المعلومات الإضافية
      const additionalNotes = [
        formData.notes,
        formData.customerType === 'company' ? `نوع العميل: شركة` : `نوع العميل: فرد`,
        formData.taxNumber ? `الرقم الضريبي: ${formData.taxNumber}` : '',
        formData.paymentOption === 'installment' ? `خيار الدفع: أقساط` : `خيار الدفع: فوري`,
        formData.debtLimit ? `حد الدين: ${formData.debtLimit}` : ''
      ].filter(Boolean).join('\n');

      // Add customer to the shared context with only database-compatible fields
      await addCustomer({
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone || '',
        address: fullAddress,
        company: formData.customerType === 'company' ? formData.name : '',
        notes: additionalNotes,
        customerNumber: customerNumber
      });
      
      toast({
        title: "تم الحفظ",
        description: "تم إضافة العميل بنجاح",
      });

      // Navigate back to customers list
      navigate("/sales/customers");
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "خطأ في إضافة العميل",
        description: "حدث خطأ أثناء إضافة العميل، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/sales/customers")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-mada-heading">عميل جديد</h1>
          <p className="text-muted-foreground">إضافة عميل جديد إلى قاعدة البيانات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم العميل *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="أدخل اسم العميل"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerNumber">رقم العميل</Label>
                  <Input
                    id="customerNumber"
                    value={customerNumber}
                    readOnly
                    placeholder="يتم توليده تلقائياً"
                    className="bg-muted cursor-not-allowed"
                  />
                </div>

                <div>
                  <Label htmlFor="customerType">نوع العميل</Label>
                  <Select 
                    value={formData.customerType} 
                    onValueChange={(value) => handleInputChange("customerType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فرد</SelectItem>
                      <SelectItem value="company">شركة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+201234567890"
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="customer@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                {formData.customerType === "company" && (
                  <div className="md:col-span-2">
                    <Label htmlFor="taxNumber">الرقم الضريبي *</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange("taxNumber", e.target.value)}
                      placeholder="أدخل الرقم الضريبي"
                      className={errors.taxNumber ? "border-destructive" : ""}
                    />
                    {errors.taxNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.taxNumber}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات العنوان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="أدخل العنوان التفصيلي"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  {formData.country === "مصر" ? (
                    <Select 
                      value={formData.city} 
                      onValueChange={(value) => handleInputChange("city", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المحافظة" />
                      </SelectTrigger>
                      <SelectContent>
                        {egyptianGovernorates.map((governorate) => (
                          <SelectItem key={governorate} value={governorate}>
                            {governorate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="الرياض"
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="country">الدولة</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => handleInputChange("country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدولة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="مصر">مصر</SelectItem>
                      <SelectItem value="المملكة العربية السعودية">المملكة العربية السعودية</SelectItem>
                      <SelectItem value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</SelectItem>
                      <SelectItem value="الكويت">الكويت</SelectItem>
                      <SelectItem value="قطر">قطر</SelectItem>
                      <SelectItem value="البحرين">البحرين</SelectItem>
                      <SelectItem value="عمان">عمان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Center field - only shown when Egypt is selected */}
              {formData.country === "مصر" && formData.city && (
                <div>
                  <Label htmlFor="center">المركز</Label>
                  <Select 
                    value={formData.center} 
                    onValueChange={(value) => handleInputChange("center", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المركز" />
                    </SelectTrigger>
                    <SelectContent>
                      {egyptianCenters[formData.city]?.map((center) => (
                        <SelectItem key={center} value={center}>
                          {center}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات المالية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentOption">خيار الدفع</Label>
                  <Select 
                    value={formData.paymentOption} 
                    onValueChange={(value) => handleInputChange("paymentOption", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر خيار الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">فوري</SelectItem>
                      <SelectItem value="installment">أقساط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="debtLimit">حد الدين (بالجنيه المصري)</Label>
                  <Input
                    id="debtLimit"
                    type="number"
                    value={formData.debtLimit}
                    onChange={(e) => handleInputChange("debtLimit", e.target.value)}
                    placeholder="أدخل حد الدين بالجنيه المصري"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="customerAdditionDate">تاريخ إضافة العميل</Label>
                <Input
                  id="customerAdditionDate"
                  value={customerAdditionDate}
                  placeholder="تاريخ إضافة العميل"
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              {/* Opening Balance Section */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOpeningBalance(!showOpeningBalance)}
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 ml-2" />
                  الرصيد الافتتاحي
                </Button>
                
                {showOpeningBalance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <Label htmlFor="openingBalanceDebit">له (مدين) - بالجنيه المصري</Label>
                      <Input
                        id="openingBalanceDebit"
                        type="number"
                        value={formData.openingBalanceDebit}
                        onChange={(e) => handleInputChange("openingBalanceDebit", e.target.value)}
                        placeholder="أدخل المبلغ المدين"
                      />
                    </div>
                    <div>
                      <Label htmlFor="openingBalanceCredit">عليه (دائن) - بالجنيه المصري</Label>
                      <Input
                        id="openingBalanceCredit"
                        type="number"
                        value={formData.openingBalanceCredit}
                        onChange={(e) => handleInputChange("openingBalanceCredit", e.target.value)}
                        placeholder="أدخل المبلغ الدائن"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات إضافية</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="أي ملاحظات إضافية عن العميل"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                ملخص العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">رقم العميل:</span>
                  <span className="font-medium">{customerNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الاسم:</span>
                  <span className="font-medium">{formData.name || "غير محدد"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">النوع:</span>
                  <span className="font-medium">
                    {formData.customerType === "individual" ? "فرد" : "شركة"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الهاتف:</span>
                  <span className="font-medium">{formData.phone || "غير محدد"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المدينة:</span>
                  <span className="font-medium">{formData.city || "غير محدد"}</span>
                </div>
                {formData.center && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المركز:</span>
                    <span className="font-medium">{formData.center}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">خيار الدفع:</span>
                  <span className="font-medium">
                    {formData.paymentOption === "immediate" ? "فوري" : "أقساط"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">حد الدين:</span>
                  <span className="font-medium">{formData.debtLimit || "غير محدد"}</span>
                </div>
                {(formData.openingBalanceDebit || formData.openingBalanceCredit) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الرصيد الافتتاحي (له):</span>
                      <span className="font-medium">{formData.openingBalanceDebit || "0"} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الرصيد الافتتاحي (عليه):</span>
                      <span className="font-medium">{formData.openingBalanceCredit || "0"} ج.م</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 ml-2" />
                حفظ العميل
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/sales/customers")}
              >
                إلغاء
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}