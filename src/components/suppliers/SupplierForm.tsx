import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, User, Mail, Phone, MapPin, CreditCard, FileText, Save, X } from 'lucide-react';

interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  center: string;
  country: string;
  category: string;
  paymentTerms: string;
  creditLimit: string;
  taxNumber: string;
  notes: string;
}

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  initialData?: Partial<SupplierFormData>;
  mode: 'add' | 'edit';
  isLoading?: boolean;
}

const countries = [
  "السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عمان", "جمهورية مصر العربية"
];

const paymentTermsOptions = [
  "نقداً فوري", "7 أيام", "14 يوم", "30 يوم", "45 يوم", "60 يوم", "90 يوم", "120 يوم"
];

const supplierCategories = [
  "مواد غذائية", "مواد البناء", "الكترونيات", "المنسوجات", "المعدات", "الخدمات", "أخرى"
];

export function SupplierForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  mode,
  isLoading = false
}: SupplierFormProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: initialData.name || '',
    contactPerson: initialData.contactPerson || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    center: initialData.center || '',
    country: initialData.country || 'السعودية',
    category: initialData.category || '',
    paymentTerms: initialData.paymentTerms || '',
    creditLimit: initialData.creditLimit || '',
    taxNumber: initialData.taxNumber || '',
    notes: initialData.notes || ''
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Partial<SupplierFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SupplierFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'اسم الشركة مطلوب';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'اسم الشخص المسؤول مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateFormData = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      center: '',
      country: 'السعودية',
      category: '',
      paymentTerms: '',
      creditLimit: '',
      taxNumber: '',
      notes: ''
    });
    setErrors({});
    setActiveTab('basic');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-background shrink-0">
          <DialogTitle className="flex items-center gap-2 font-cairo">
            <Building2 className="h-5 w-5" />
            {mode === 'add' ? 'إضافة مورد جديد' : 'تعديل بيانات المورد'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4 shrink-0">
            <TabsTrigger value="basic" className="font-cairo">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="financial" className="font-cairo">المعلومات المالية</TabsTrigger>
            <TabsTrigger value="additional" className="font-cairo">معلومات إضافية</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* المعلومات الأساسية */}
                <TabsContent value="basic" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    بيانات الشركة
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-tajawal">
                      اسم الشركة <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder="اسم الشركة"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="font-tajawal">تصنيف الشركة</Label>
                    <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="font-cairo">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxNumber" className="font-tajawal">الرقم الضريبي</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => updateFormData('taxNumber', e.target.value)}
                      placeholder="الرقم الضريبي للشركة"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    الشخص المسؤول
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="font-tajawal">
                      اسم الشخص المسؤول <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => updateFormData('contactPerson', e.target.value)}
                      placeholder="اسم الشخص المسؤول"
                      className={errors.contactPerson ? 'border-red-500' : ''}
                    />
                    {errors.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-tajawal">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+966501234567"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="font-tajawal">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="email@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    العنوان
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="font-tajawal">العنوان التفصيلي</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="العنوان بالتفصيل"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-tajawal">المدينة</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="المدينة"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="center" className="font-tajawal">المركز</Label>
                    <Input
                      id="center"
                      value={formData.center}
                      onChange={(e) => updateFormData('center', e.target.value)}
                      placeholder="المركز"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="font-tajawal">الدولة</Label>
                    <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country} className="font-cairo">
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

                {/* المعلومات المالية */}
                <TabsContent value="financial" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5" />
                    الشروط المالية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="font-tajawal">شروط الدفع</Label>
                    <Select value={formData.paymentTerms} onValueChange={(value) => updateFormData('paymentTerms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر شروط الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTermsOptions.map((term) => (
                          <SelectItem key={term} value={term} className="font-cairo">
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creditLimit" className="font-tajawal">الحد الائتماني</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => updateFormData('creditLimit', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

                {/* معلومات إضافية */}
                <TabsContent value="additional" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    ملاحظات وتفاصيل إضافية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      placeholder="أدخل أي ملاحظات أو تفاصيل إضافية عن المورد"
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>
                </TabsContent>

                {/* أزرار الحفظ والإلغاء */}
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t bg-background sticky bottom-0">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                    <X className="ml-2 h-4 w-4" />
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-cairo">
                    {isLoading ? (
                      <>جاري الحفظ...</>
                    ) : (
                      <>
                        <Save className="ml-2 h-4 w-4" />
                        {mode === 'add' ? 'إضافة المورد' : 'حفظ التعديلات'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
  );
}