/**
 * نظام إدارة البيانات المحسن مع validation وmعالجة الأخطاء
 */

import { z } from 'zod';
import { storage } from './storage';

// أنواع البيانات الأساسية
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

export type DataOperationResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Validation Schemas
export const ProductSchema = z.object({
  id: z.string().min(1, 'ID مطلوب'),
  name: z.string().min(1, 'اسم المنتج مطلوب').max(100, 'اسم المنتج طويل جداً'),
  barcode: z.string().optional(),
  category: z.string().min(1, 'التصنيف مطلوب'),
  buyPrice: z.number().min(0, 'سعر الشراء يجب أن يكون أكبر من أو يساوي صفر'),
  sellPrice: z.number().min(0, 'سعر البيع يجب أن يكون أكبر من أو يساوي صفر'),
  stock: z.number().min(0, 'المخزون يجب أن يكون أكبر من أو يساوي صفر'),
  minStock: z.number().min(0, 'الحد الأدنى للمخزون يجب أن يكون أكبر من أو يساوي صفر'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const CustomerSchema = z.object({
  id: z.string().min(1, 'ID مطلوب'),
  name: z.string().min(1, 'اسم العميل مطلوب').max(100, 'اسم العميل طويل جداً'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  address: z.string().optional(),
  type: z.enum(['individual', 'company'], {
    errorMap: () => ({ message: 'نوع العميل يجب أن يكون فرد أو شركة' })
  }),
  creditLimit: z.number().min(0, 'حد الائتمان يجب أن يكون أكبر من أو يساوي صفر').optional(),
  createdAt: z.string().optional(),
  notes: z.string().optional()
});

export const InvoiceSchema = z.object({
  id: z.string().min(1, 'ID مطلوب'),
  customerId: z.string().min(1, 'معرف العميل مطلوب'),
  customerName: z.string().min(1, 'اسم العميل مطلوب'),
  items: z.array(z.object({
    productId: z.string().min(1, 'معرف المنتج مطلوب'),
    productName: z.string().min(1, 'اسم المنتج مطلوب'),
    quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
    price: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
    total: z.number().min(0, 'المجموع يجب أن يكون أكبر من أو يساوي صفر')
  })).min(1, 'يجب إضافة عنصر واحد على الأقل'),
  subtotal: z.number().min(0, 'المجموع الفرعي يجب أن يكون أكبر من أو يساوي صفر'),
  tax: z.number().min(0, 'الضريبة يجب أن تكون أكبر من أو يساوي صفر'),
  discount: z.number().min(0, 'الخصم يجب أن يكون أكبر من أو يساوي صفر'),
  total: z.number().min(0, 'الإجمالي يجب أن يكون أكبر من أو يساوي صفر'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  status: z.enum(['pending', 'paid', 'cancelled'], {
    errorMap: () => ({ message: 'حالة الفاتورة غير صحيحة' })
  }).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

export type Product = z.infer<typeof ProductSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * مدير البيانات المحسن
 */
export class DataManager {
  private static instance: DataManager;

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * التحقق من صحة البيانات
   */
  validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          errors: result.error.errors.map(err => err.message)
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: ['خطأ في التحقق من البيانات']
      };
    }
  }

  /**
   * حفظ البيانات مع validation
   */
  async saveData<T>(
    key: string, 
    data: T, 
    schema: z.ZodSchema<T>
  ): Promise<DataOperationResult<T>> {
    try {
      // التحقق من صحة البيانات
      const validation = this.validate(schema, data);
      if (!validation.success) {
        return {
          success: false,
          error: validation.errors?.join(', ') || 'بيانات غير صحيحة'
        };
      }

      // حفظ البيانات
      const saveSuccess = storage.setItem(key, validation.data);
      
      if (saveSuccess) {
        return {
          success: true,
          data: validation.data
        };
      } else {
        return {
          success: false,
          error: 'فشل في حفظ البيانات'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `خطأ في حفظ البيانات: ${error.message}`
      };
    }
  }

  /**
   * تحميل البيانات مع validation
   */
  async loadData<T>(
    key: string, 
    schema: z.ZodSchema<T>, 
    defaultValue: T[] = []
  ): Promise<DataOperationResult<T[]>> {
    try {
      const data = storage.getItem(key, defaultValue) as T[];
      
      // التحقق من صحة كل عنصر
      const validatedData: T[] = [];
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const validation = this.validate(schema, data[i]);
        if (validation.success && validation.data) {
          validatedData.push(validation.data);
        } else {
          errors.push(`العنصر ${i + 1}: ${validation.errors?.join(', ')}`);
        }
      }

      if (errors.length > 0) {
        console.warn(`تم تجاهل ${errors.length} عنصر غير صحيح من ${key}:`, errors);
      }

      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      return {
        success: false,
        error: `خطأ في تحميل البيانات: ${error.message}`
      };
    }
  }

  /**
   * إضافة عنصر جديد إلى قائمة
   */
  async addItem<T>(
    key: string, 
    item: T, 
    schema: z.ZodSchema<T>
  ): Promise<DataOperationResult<T[]>> {
    try {
      const currentData = await this.loadData(key, schema);
      if (!currentData.success) {
        return currentData;
      }

      const validation = this.validate(schema, item);
      if (!validation.success) {
        return {
          success: false,
          error: validation.errors?.join(', ') || 'بيانات غير صحيحة'
        };
      }

      const newData = [...(currentData.data || []), validation.data!];
      const saveResult = storage.setItem(key, newData);

      if (saveResult) {
        return {
          success: true,
          data: newData
        };
      } else {
        return {
          success: false,
          error: 'فشل في حفظ البيانات'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `خطأ في إضافة العنصر: ${error.message}`
      };
    }
  }

  /**
   * تحديث عنصر في قائمة
   */
  async updateItem<T extends { id: string }>(
    key: string, 
    id: string, 
    updatedItem: T, 
    schema: z.ZodSchema<T>
  ): Promise<DataOperationResult<T[]>> {
    try {
      const currentData = await this.loadData(key, schema);
      if (!currentData.success) {
        return currentData;
      }

      const validation = this.validate(schema, updatedItem);
      if (!validation.success) {
        return {
          success: false,
          error: validation.errors?.join(', ') || 'بيانات غير صحيحة'
        };
      }

      const newData = (currentData.data || []).map(item => 
        item.id === id ? validation.data! : item
      );

      const saveResult = storage.setItem(key, newData);

      if (saveResult) {
        return {
          success: true,
          data: newData
        };
      } else {
        return {
          success: false,
          error: 'فشل في حفظ البيانات'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `خطأ في تحديث العنصر: ${error.message}`
      };
    }
  }

  /**
   * حذف عنصر من قائمة
   */
  async deleteItem<T extends { id: string }>(
    key: string, 
    id: string, 
    schema: z.ZodSchema<T>
  ): Promise<DataOperationResult<T[]>> {
    try {
      const currentData = await this.loadData(key, schema);
      if (!currentData.success) {
        return currentData;
      }

      const newData = (currentData.data || []).filter(item => item.id !== id);
      const saveResult = storage.setItem(key, newData);

      if (saveResult) {
        return {
          success: true,
          data: newData
        };
      } else {
        return {
          success: false,
          error: 'فشل في حفظ البيانات'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `خطأ في حذف العنصر: ${error.message}`
      };
    }
  }

  /**
   * تنظيف البيانات التالفة
   */
  async cleanupCorruptedData<T>(
    key: string, 
    schema: z.ZodSchema<T>
  ): Promise<DataOperationResult<number>> {
    try {
      const rawData = storage.getItem(key, []);
      let cleanedCount = 0;
      const validData: T[] = [];

      for (const item of rawData) {
        const validation = this.validate(schema, item);
        if (validation.success && validation.data) {
          validData.push(validation.data);
        } else {
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        storage.setItem(key, validData);
      }

      return {
        success: true,
        data: cleanedCount
      };
    } catch (error) {
      return {
        success: false,
        error: `خطأ في تنظيف البيانات: ${error.message}`
      };
    }
  }
}

// إنشاء instance عامة
export const dataManager = DataManager.getInstance();