/**
 * إعداد التسليم النهائي - تجهيز النظام للعميل
 */

interface DeliverySetupConfig {
  companyName: string;
  companyNameEn: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  currency: 'SAR' | 'USD' | 'EUR' | 'AED' | 'EGP' | 'JOD';
  timezone: string;
  industry: string;
  generateSampleData: boolean;
  setupAdminUser: boolean;
  enableTrial: boolean;
}

export class FinalDeliverySetup {
  private static instance: FinalDeliverySetup;

  static getInstance(): FinalDeliverySetup {
    if (!FinalDeliverySetup.instance) {
      FinalDeliverySetup.instance = new FinalDeliverySetup();
    }
    return FinalDeliverySetup.instance;
  }

  /**
   * إعداد شامل للتسليم النهائي
   */
  async setupForDelivery(config: DeliverySetupConfig): Promise<{
    success: boolean;
    steps: Array<{ step: string; success: boolean; message: string }>;
  }> {
    const steps: Array<{ step: string; success: boolean; message: string }> = [];

    try {
      // 1. إعداد بيانات الشركة
      const companyStep = await this.setupCompanyData(config);
      steps.push(companyStep);

      // 2. إعداد المستخدم الإداري
      if (config.setupAdminUser) {
        const adminStep = await this.setupAdminUser(config);
        steps.push(adminStep);
      }

      // 3. إنشاء البيانات التجريبية
      if (config.generateSampleData) {
        const sampleDataStep = await this.generateSampleData(config);
        steps.push(sampleDataStep);
      }

      // 4. إعداد الترخيص التجريبي
      if (config.enableTrial) {
        const licenseStep = await this.setupTrialLicense(config);
        steps.push(licenseStep);
      }

      // 5. تحسين قوالب الطباعة
      const printStep = await this.optimizePrintTemplates(config);
      steps.push(printStep);

      // 6. إعداد العملة والتنسيقات
      const currencyStep = await this.setupCurrencyAndFormats(config);
      steps.push(currencyStep);

      // 7. تنظيف وتحسين النظام
      const cleanupStep = await this.performFinalCleanup();
      steps.push(cleanupStep);

      // 8. إنشاء دليل المستخدم المخصص
      const guideStep = await this.generateCustomUserGuide(config);
      steps.push(guideStep);

      const allSuccessful = steps.every(step => step.success);

      return {
        success: allSuccessful,
        steps
      };

    } catch (error) {
      console.error('خطأ في الإعداد النهائي:', error);
      steps.push({
        step: 'إعداد عام',
        success: false,
        message: `خطأ عام: ${error}`
      });

      return {
        success: false,
        steps
      };
    }
  }

  /**
   * إعداد بيانات الشركة
   */
  private async setupCompanyData(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      const companySettings = {
        name: config.companyName,
        nameEn: config.companyNameEn,
        address: config.address,
        phone: config.phone,
        email: config.email,
        website: config.website || '',
        logo: config.logo || '',
        currency: config.currency,
        timezone: config.timezone,
        industry: config.industry,
        fiscalYearStart: '01-01',
        taxNumber: '',
        commercialRegister: '',
        description: `نظام عمران للمبيعات - ${config.companyName}`,
        setupDate: new Date().toISOString()
      };

      localStorage.setItem('company_settings', JSON.stringify(companySettings));
      localStorage.setItem('program_name', config.companyName);
      localStorage.setItem('app_title', `نظام ${config.companyName} للمبيعات`);

      return {
        step: 'إعداد بيانات الشركة',
        success: true,
        message: 'تم حفظ بيانات الشركة بنجاح'
      };

    } catch (error) {
      return {
        step: 'إعداد بيانات الشركة',
        success: false,
        message: `فشل في حفظ بيانات الشركة: ${error}`
      };
    }
  }

  /**
   * إعداد المستخدم الإداري
   */
  private async setupAdminUser(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      const adminUser = {
        id: 'admin-001',
        username: 'admin',
        email: config.email,
        name: 'مدير النظام',
        role: 'admin',
        permissions: ['all'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        companyName: config.companyName
      };

      localStorage.setItem('current_user', JSON.stringify(adminUser));
      localStorage.setItem('users', JSON.stringify([adminUser]));
      localStorage.setItem('is_authenticated', 'true');

      return {
        step: 'إعداد المستخدم الإداري',
        success: true,
        message: 'تم إنشاء حساب المدير بنجاح'
      };

    } catch (error) {
      return {
        step: 'إعداد المستخدم الإداري',
        success: false,
        message: `فشل في إنشاء المستخدم الإداري: ${error}`
      };
    }
  }

  /**
   * إنشاء البيانات التجريبية المخصصة
   */
  private async generateSampleData(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      // منتجات حسب نوع الصناعة
      let sampleProducts = this.getIndustrySpecificProducts(config.industry);
      
      // عملاء تجريبيون
      const sampleCustomers = [
        {
          id: 'cust-001',
          name: 'أحمد محمد العلي',
          email: 'ahmed@example.com',
          phone: '0501234567',
          address: 'الرياض، السعودية',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-002',
          name: `شركة ${config.companyName} التجارية`,
          email: 'info@company.com',
          phone: '0112345678',
          address: 'جدة، السعودية',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-003',
          name: 'فاطمة حسن محمود',
          email: 'fatma@example.com',
          phone: '0551234567',
          address: 'الدمام، السعودية',
          createdAt: new Date().toISOString()
        }
      ];

      // موردون تجريبيون
      const sampleSuppliers = [
        {
          id: 'supp-001',
          name: 'شركة التقنية المتقدمة',
          email: 'sales@tech.com',
          phone: '0114567890',
          address: 'الرياض، السعودية',
          rating: 4.5,
          createdAt: new Date().toISOString()
        },
        {
          id: 'supp-002',
          name: 'مؤسسة التجارة الحديثة',
          email: 'orders@modern.com',
          phone: '0123456789',
          address: 'الدمام، السعودية',
          rating: 4.2,
          createdAt: new Date().toISOString()
        }
      ];

      // حفظ البيانات
      localStorage.setItem('products', JSON.stringify(sampleProducts));
      localStorage.setItem('customers', JSON.stringify(sampleCustomers));
      localStorage.setItem('suppliers', JSON.stringify(sampleSuppliers));

      // إنشاء فاتورة تجريبية
      const sampleInvoice = {
        id: 'invoice-001',
        customerId: sampleCustomers[0].id,
        customerName: sampleCustomers[0].name,
        items: [
          {
            productId: sampleProducts[0].id,
            productName: sampleProducts[0].name,
            quantity: 2,
            price: sampleProducts[0].price,
            total: sampleProducts[0].price * 2
          }
        ],
        subtotal: sampleProducts[0].price * 2,
        discount: 0,
        tax: (sampleProducts[0].price * 2) * 0.15,
        total: (sampleProducts[0].price * 2) * 1.15,
        date: new Date().toISOString(),
        status: 'completed' as const,
        paymentMethod: 'cash' as const,
        notes: `فاتورة تجريبية - ${config.companyName}`
      };

      localStorage.setItem('sales_invoices', JSON.stringify([sampleInvoice]));

      return {
        step: 'إنشاء البيانات التجريبية',
        success: true,
        message: `تم إنشاء ${sampleProducts.length} منتجات، ${sampleCustomers.length} عملاء، ${sampleSuppliers.length} موردين`
      };

    } catch (error) {
      return {
        step: 'إنشاء البيانات التجريبية',
        success: false,
        message: `فشل في إنشاء البيانات التجريبية: ${error}`
      };
    }
  }

  /**
   * إعداد الترخيص التجريبي
   */
  private async setupTrialLicense(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 يوم تجريبي

      const licenseInfo = {
        key: `TRIAL-${Date.now()}`,
        type: 'trial' as const,
        expiryDate: expiryDate.toISOString(),
        maxUsers: 5,
        features: ['sales', 'inventory', 'purchases', 'reports', 'customers'],
        companyName: config.companyName,
        contactEmail: config.email,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('omran_license_info', JSON.stringify(licenseInfo));

      return {
        step: 'إعداد الترخيص التجريبي',
        success: true,
        message: 'تم إنشاء ترخيص تجريبي لمدة 30 يوماً'
      };

    } catch (error) {
      return {
        step: 'إعداد الترخيص التجريبي',
        success: false,
        message: `فشل في إعداد الترخيص: ${error}`
      };
    }
  }

  /**
   * تحسين قوالب الطباعة
   */
  private async optimizePrintTemplates(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      const printSettings = {
        companyName: config.companyName,
        companyNameEn: config.companyNameEn,
        address: config.address,
        phone: config.phone,
        email: config.email,
        website: config.website,
        logo: config.logo,
        currency: config.currency,
        showLogo: !!config.logo,
        showCompanyInfo: true,
        paperSize: 'A4',
        fontSize: 'medium',
        theme: 'professional',
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('print_settings', JSON.stringify(printSettings));

      return {
        step: 'تحسين قوالب الطباعة',
        success: true,
        message: 'تم تخصيص قوالب الطباعة لبيانات الشركة'
      };

    } catch (error) {
      return {
        step: 'تحسين قوالب الطباعة',
        success: false,
        message: `فشل في تحسين قوالب الطباعة: ${error}`
      };
    }
  }

  /**
   * إعداد العملة والتنسيقات
   */
  private async setupCurrencyAndFormats(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      const currencySettings = {
        primary: config.currency,
        symbol: this.getCurrencySymbol(config.currency),
        decimalPlaces: 2,
        thousandSeparator: ',',
        decimalSeparator: '.',
        showSymbol: true,
        symbolPosition: 'after', // بعد الرقم للعربية
        rtl: true,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('currency_settings', JSON.stringify(currencySettings));
      localStorage.setItem('app_currency', config.currency);

      return {
        step: 'إعداد العملة والتنسيقات',
        success: true,
        message: `تم تعيين ${config.currency} كعملة افتراضية`
      };

    } catch (error) {
      return {
        step: 'إعداد العملة والتنسيقات',
        success: false,
        message: `فشل في إعداد العملة: ${error}`
      };
    }
  }

  /**
   * تنظيف نهائي للنظام
   */
  private async performFinalCleanup(): Promise<{ step: string; success: boolean; message: string }> {
    try {
      // إزالة البيانات التطويرية
      const devKeys = [
        'debug_mode',
        'dev_logs',
        'test_data',
        'sample_override',
        'dev_settings'
      ];

      devKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // تحسين الأداء
      if (window.performance && window.performance.clearMarks) {
        window.performance.clearMarks();
      }

      // تأكيد الإعدادات
      localStorage.setItem('production_ready', 'true');
      localStorage.setItem('setup_completed', new Date().toISOString());

      return {
        step: 'التنظيف النهائي',
        success: true,
        message: 'تم تنظيف النظام وإعداده للإنتاج'
      };

    } catch (error) {
      return {
        step: 'التنظيف النهائي',
        success: false,
        message: `فشل في التنظيف النهائي: ${error}`
      };
    }
  }

  /**
   * إنشاء دليل مستخدم مخصص
   */
  private async generateCustomUserGuide(config: DeliverySetupConfig): Promise<{ step: string; success: boolean; message: string }> {
    try {
      const userGuide = {
        companyName: config.companyName,
        createdAt: new Date().toISOString(),
        sections: [
          {
            title: 'مرحباً بك في نظام عمران للمبيعات',
            content: `هذا الدليل مخصص لشركة ${config.companyName}`
          },
          {
            title: 'البدء السريع',
            content: 'خطوات البدء الأساسية...'
          },
          {
            title: 'إدارة المبيعات',
            content: 'كيفية إنشاء فواتير البيع وإدارة العملاء...'
          },
          {
            title: 'إدارة المخزون',
            content: 'إضافة المنتجات ومتابعة المخزون...'
          },
          {
            title: 'التقارير',
            content: 'إنشاء التقارير المالية والإدارية...'
          },
          {
            title: 'الدعم الفني',
            content: `للدعم الفني، يرجى التواصل على: ${config.phone} أو ${config.email}`
          }
        ]
      };

      localStorage.setItem('custom_user_guide', JSON.stringify(userGuide));

      return {
        step: 'إنشاء دليل المستخدم',
        success: true,
        message: 'تم إنشاء دليل مستخدم مخصص للشركة'
      };

    } catch (error) {
      return {
        step: 'إنشاء دليل المستخدم',
        success: false,
        message: `فشل في إنشاء دليل المستخدم: ${error}`
      };
    }
  }

  /**
   * منتجات حسب نوع الصناعة
   */
  private getIndustrySpecificProducts(industry: string) {
    const baseId = Date.now();
    
    switch (industry) {
      case 'تجارة التجزئة':
        return [
          {
            id: `prod-${baseId + 1}`,
            name: 'جهاز كمبيوتر محمول',
            price: 2500,
            cost: 2000,
            quantity: 10,
            minQuantity: 2,
            category: 'إلكترونيات',
            barcode: `${baseId}001`,
            description: 'جهاز كمبيوتر محمول عالي الأداء',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: `prod-${baseId + 2}`,
            name: 'ساعة ذكية',
            price: 800,
            cost: 600,
            quantity: 15,
            minQuantity: 3,
            category: 'إكسسوارات',
            barcode: `${baseId}002`,
            description: 'ساعة ذكية بمميزات متقدمة',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

      case 'المطاعم والكافيهات':
        return [
          {
            id: `prod-${baseId + 1}`,
            name: 'قهوة عربية مميزة',
            price: 45,
            cost: 30,
            quantity: 50,
            minQuantity: 10,
            category: 'مشروبات',
            barcode: `${baseId}001`,
            description: 'قهوة عربية من أجود الأنواع',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: `prod-${baseId + 2}`,
            name: 'كيك بالشوكولاتة',
            price: 85,
            cost: 50,
            quantity: 20,
            minQuantity: 5,
            category: 'حلويات',
            barcode: `${baseId}002`,
            description: 'كيك طازج بالشوكولاتة الفاخرة',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

      case 'الأزياء والملابس':
        return [
          {
            id: `prod-${baseId + 1}`,
            name: 'قميص رجالي قطني',
            price: 150,
            cost: 80,
            quantity: 25,
            minQuantity: 5,
            category: 'ملابس رجالية',
            barcode: `${baseId}001`,
            description: 'قميص قطني عالي الجودة',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: `prod-${baseId + 2}`,
            name: 'فستان نسائي أنيق',
            price: 280,
            cost: 150,
            quantity: 15,
            minQuantity: 3,
            category: 'ملابس نسائية',
            barcode: `${baseId}002`,
            description: 'فستان أنيق مناسب للمناسبات',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

      default:
        return [
          {
            id: `prod-${baseId + 1}`,
            name: 'منتج أساسي',
            price: 100,
            cost: 70,
            quantity: 20,
            minQuantity: 5,
            category: 'عام',
            barcode: `${baseId}001`,
            description: 'منتج تجريبي للاختبار',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
    }
  }

  /**
   * الحصول على رمز العملة
   */
  private getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'SAR': 'ر.س',
      'USD': '$',
      'EUR': '€',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'JOD': 'د.أ'
    };
    return symbols[currency] || currency;
  }
}

export const finalDeliverySetup = FinalDeliverySetup.getInstance();