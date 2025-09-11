import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';

export class InventoryDataGenerator {
  private static instance: InventoryDataGenerator;

  static getInstance(): InventoryDataGenerator {
    if (!InventoryDataGenerator.instance) {
      InventoryDataGenerator.instance = new InventoryDataGenerator();
    }
    return InventoryDataGenerator.instance;
  }

  // تم إلغاء إنشاء البيانات التجريبية للمخزون
  generateSampleInventoryData(): void {
    console.log('❌ تم إلغاء إنشاء البيانات التجريبية - المنتجات ستتم إضافتها يدوياً');
  }

  // تم إلغاء إنشاء المنتجات الافتراضية
  private ensureProducts(): void {
    // لن يتم إنشاء منتجات افتراضية
  }

  // التأكد من وجود فواتير مبيعات مع عناصر
  private ensureSalesInvoicesWithItems(): void {
    let salesInvoices = storage.getItem('sales_invoices', []);
    const products = storage.getItem('products', []);
    
    if (salesInvoices.length === 0 || !salesInvoices[0]?.items) {
      salesInvoices = [
        {
          id: 'inv_001',
          invoiceNumber: 'INV-001',
          date: new Date().toISOString(),
          customerName: 'أحمد محمد',
          customerPhone: '01012345678',
          customerId: 'cust_001',
          items: [
            {
              id: 'item_001',
              productId: products[0]?.id || 'prod_1',
              productName: products[0]?.name || 'لابتوب ديل',
              productCode: products[0]?.code || 'DELL001',
              quantity: 2,
              price: products[0]?.price || 15000,
              cost: products[0]?.cost || 12000,
              total: (products[0]?.price || 15000) * 2
            },
            {
              id: 'item_002',
              productId: products[3]?.id || 'prod_4',
              productName: products[3]?.name || 'ماوس لاسلكي',
              productCode: products[3]?.code || 'MOUSE001',
              quantity: 3,
              price: products[3]?.price || 150,
              cost: products[3]?.cost || 80,
              total: (products[3]?.price || 150) * 3
            }
          ],
          total: 30450,
          paymentStatus: 'paid',
          paymentMethod: 'نقدي',
          linkedToCustomer: true
        },
        {
          id: 'inv_002',
          invoiceNumber: 'INV-002',
          date: new Date(Date.now() - 86400000).toISOString(),
          customerName: 'فاطمة علي',
          customerPhone: '01098765432',
          customerId: 'cust_002',
          items: [
            {
              id: 'item_003',
              productId: products[1]?.id || 'prod_2',
              productName: products[1]?.name || 'هاتف سامسونج',
              productCode: products[1]?.code || 'SAM001',
              quantity: 1,
              price: products[1]?.price || 8000,
              cost: products[1]?.cost || 6000,
              total: products[1]?.price || 8000
            },
            {
              id: 'item_004',
              productId: products[4]?.id || 'prod_5',
              productName: products[4]?.name || 'شاشة LED',
              productCode: products[4]?.code || 'LED001',
              quantity: 1,
              price: products[4]?.price || 2500,
              cost: products[4]?.cost || 1800,
              total: products[4]?.price || 2500
            }
          ],
          total: 10500,
          paymentStatus: 'paid',
          paymentMethod: 'بطاقة',
          linkedToCustomer: true
        },
        {
          id: 'inv_003',
          invoiceNumber: 'INV-003',
          date: new Date(Date.now() - 172800000).toISOString(),
          customerName: 'محمد حسن',
          customerPhone: '01087654321',
          customerId: 'cust_003',
          items: [
            {
              id: 'item_005',
              productId: products[2]?.id || 'prod_3',
              productName: products[2]?.name || 'طابعة HP',
              productCode: products[2]?.code || 'HP001',
              quantity: 2,
              price: products[2]?.price || 3000,
              cost: products[2]?.cost || 2200,
              total: (products[2]?.price || 3000) * 2
            }
          ],
          total: 6000,
          paymentStatus: 'paid',
          paymentMethod: 'نقدي',
          linkedToCustomer: true
        }
      ];
      
      storage.setItem('sales_invoices', salesInvoices);
    }
  }

  // التأكد من وجود فواتير مشتريات مع عناصر
  private ensurePurchaseInvoicesWithItems(): void {
    let purchaseInvoices = storage.getItem('purchase_invoices', []);
    const products = storage.getItem('products', []);
    
    if (purchaseInvoices.length === 0 || !purchaseInvoices[0]?.items) {
      purchaseInvoices = [
        {
          id: 'purch_001',
          invoiceNumber: 'PURCH-001',
          date: new Date(Date.now() - 259200000).toISOString(),
          supplierName: 'مورد الأجهزة الإلكترونية',
          supplierPhone: '01020304050',
          supplierId: 'supp_001',
          items: [
            {
              id: 'pitem_001',
              productId: products[0]?.id || 'prod_1',
              productName: products[0]?.name || 'لابتوب ديل',
              productCode: products[0]?.code || 'DELL001',
              quantity: 10,
              cost: products[0]?.cost || 12000,
              total: (products[0]?.cost || 12000) * 10
            },
            {
              id: 'pitem_002',
              productId: products[1]?.id || 'prod_2',
              productName: products[1]?.name || 'هاتف سامسونج',
              productCode: products[1]?.code || 'SAM001',
              quantity: 15,
              cost: products[1]?.cost || 6000,
              total: (products[1]?.cost || 6000) * 15
            }
          ],
          total: 210000,
          paymentStatus: 'paid',
          paymentMethod: 'تحويل بنكي',
          linkedToSupplier: true
        },
        {
          id: 'purch_002',
          invoiceNumber: 'PURCH-002',
          date: new Date(Date.now() - 345600000).toISOString(),
          supplierName: 'مورد المعدات المكتبية',
          supplierPhone: '01030405060',
          supplierId: 'supp_002',
          items: [
            {
              id: 'pitem_003',
              productId: products[2]?.id || 'prod_3',
              productName: products[2]?.name || 'طابعة HP',
              productCode: products[2]?.code || 'HP001',
              quantity: 8,
              cost: products[2]?.cost || 2200,
              total: (products[2]?.cost || 2200) * 8
            },
            {
              id: 'pitem_004',
              productId: products[3]?.id || 'prod_4',
              productName: products[3]?.name || 'ماوس لاسلكي',
              productCode: products[3]?.code || 'MOUSE001',
              quantity: 50,
              cost: products[3]?.cost || 80,
              total: (products[3]?.cost || 80) * 50
            },
            {
              id: 'pitem_005',
              productId: products[4]?.id || 'prod_5',
              productName: products[4]?.name || 'شاشة LED',
              productCode: products[4]?.code || 'LED001',
              quantity: 12,
              cost: products[4]?.cost || 1800,
              total: (products[4]?.cost || 1800) * 12
            }
          ],
          total: 43400,
          paymentStatus: 'paid',
          paymentMethod: 'نقدي',
          linkedToSupplier: true
        }
      ];
      
      storage.setItem('purchase_invoices', purchaseInvoices);
    }
  }

  // إنشاء حركات مخزون
  private generateInventoryMovements(): void {
    const products = storage.getItem('products', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    
    // إنشاء حركات للمشتريات
    purchaseInvoices.forEach((invoice: any) => {
      if (invoice.items) {
        invoice.items.forEach((item: any) => {
          inventoryManager.addPurchaseMovement(
            item.productId,
            item.quantity,
            item.total,
            invoice.id
          );
        });
      }
    });
    
    // إنشاء حركات للمبيعات
    salesInvoices.forEach((invoice: any) => {
      if (invoice.items) {
        invoice.items.forEach((item: any) => {
          inventoryManager.addSaleMovement(
            item.productId,
            item.quantity,
            item.total,
            invoice.id
          );
        });
      }
    });
    
    // إنشاء حركات تعديل إضافية
    products.forEach((product: any, index: number) => {
      if (index % 2 === 0) {
        inventoryManager.addStockAdjustment(
          product.id,
          Math.floor(Math.random() * 5) + 1,
          'تعديل جرد',
          'in'
        );
      }
    });
  }

  // التأكد من وجود عملاء وموردين
  ensureCustomersAndSuppliers(): void {
    let customers = storage.getItem('customers', []);
    let suppliers = storage.getItem('suppliers', []);
    
    if (customers.length === 0) {
      customers = [
        {
          id: 'cust_001',
          name: 'أحمد محمد',
          phone: '01012345678',
          address: 'القاهرة، مصر',
          email: 'ahmed@example.com',
          totalPurchases: 30450,
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust_002',
          name: 'فاطمة علي',
          phone: '01098765432',
          address: 'الجيزة، مصر',
          email: 'fatma@example.com',
          totalPurchases: 10500,
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust_003',
          name: 'محمد حسن',
          phone: '01087654321',
          address: 'الإسكندرية، مصر',
          email: 'mohamed@example.com',
          totalPurchases: 6000,
          createdAt: new Date().toISOString()
        }
      ];
      storage.setItem('customers', customers);
    }
    
    if (suppliers.length === 0) {
      suppliers = [
        {
          id: 'supp_001',
          name: 'مورد الأجهزة الإلكترونية',
          phone: '01020304050',
          address: 'القاهرة، مصر',
          email: 'electronics@example.com',
          totalPurchases: 210000,
          createdAt: new Date().toISOString()
        },
        {
          id: 'supp_002',
          name: 'مورد المعدات المكتبية',
          phone: '01030405060',
          address: 'الجيزة، مصر',
          email: 'office@example.com',
          totalPurchases: 43400,
          createdAt: new Date().toISOString()
        }
      ];
      storage.setItem('suppliers', suppliers);
    }
  }

  // إنشاء جميع البيانات المطلوبة
  generateAllRequiredData(): void {
    this.ensureCustomersAndSuppliers();
    this.generateSampleInventoryData();
  }
}

export const inventoryDataGenerator = InventoryDataGenerator.getInstance();