import { test, expect } from '@playwright/test';

test.describe('إدارة المخزون', () => {
  test.beforeEach(async ({ page }) => {
    // تسجيل الدخول
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@omran.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('يمكن عرض قائمة المنتجات', async ({ page }) => {
    await page.goto('/inventory/products');
    
    await expect(page.locator('h1')).toContainText('المنتجات');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /إضافة منتج/ })).toBeVisible();
  });

  test('يمكن إضافة منتج جديد', async ({ page }) => {
    await page.goto('/inventory/products/new');
    
    await expect(page.locator('h1')).toContainText('منتج جديد');
    
    // ملء بيانات المنتج
    await page.fill('input[name="name"]', 'منتج اختبار');
    await page.fill('input[name="price"]', '150');
    await page.fill('input[name="cost"]', '100');
    await page.fill('input[name="quantity"]', '50');
    await page.fill('input[name="minQuantity"]', '10');
    await page.fill('input[name="category"]', 'فئة اختبار');
    
    // حفظ المنتج
    await page.click('button[type="submit"]');
    
    // التحقق من الحفظ
    await expect(page.locator('[role="alert"]:has-text("تم حفظ المنتج")')).toBeVisible();
  });

  test('يمكن تعديل منتج موجود', async ({ page }) => {
    await page.goto('/inventory/products');
    
    // النقر على أول منتج للتعديل
    await page.click('button[aria-label="تعديل المنتج"]');
    
    // تعديل السعر
    const priceInput = page.locator('input[name="price"]');
    await priceInput.clear();
    await priceInput.fill('200');
    
    // حفظ التعديلات
    await page.click('button:has-text("حفظ التغييرات")');
    
    // التحقق من التحديث
    await expect(page.locator('[role="alert"]:has-text("تم تحديث المنتج")')).toBeVisible();
  });

  test('يظهر تنبيهات المخزون المنخفض', async ({ page }) => {
    await page.goto('/inventory/stock');
    
    await expect(page.locator('h1')).toContainText('حالة المخزون');
    
    // التحقق من وجود قسم التنبيهات
    const alertsSection = page.locator('[data-testid="stock-alerts"]');
    await expect(alertsSection).toBeVisible();
  });

  test('يمكن طباعة الباركود', async ({ page }) => {
    await page.goto('/inventory/barcode');
    
    await expect(page.locator('h1')).toContainText('إدارة الباركود');
    
    // التحقق من وجود منتجات
    await expect(page.locator('table')).toBeVisible();
  });

  test('يتم ربط المخزون بإدارة المنتجات', async ({ page }) => {
    // إضافة منتج جديد
    await page.goto('/inventory/products/new');
    await page.fill('input[name="name"]', 'منتج مترابط');
    await page.fill('input[name="price"]', '100');
    await page.fill('input[name="cost"]', '70');
    await page.fill('input[name="quantity"]', '20');
    await page.fill('input[name="minQuantity"]', '5');
    await page.fill('input[name="category"]', 'اختبار');
    
    await page.click('button[type="submit"]');
    
    // التحقق من الحفظ
    await expect(page.locator('[role="alert"]:has-text("تم إضافة المنتج بنجاح")')).toBeVisible();
    
    // التحقق من ظهور المنتج في المخزون
    await page.goto('/inventory/stock');
    await expect(page.locator('text=منتج مترابط')).toBeVisible();
    
    // التحقق من ظهور المنتج في الباركود
    await page.goto('/inventory/barcode');
    await expect(page.locator('text=منتج مترابط')).toBeVisible();
  });

  test('يظهر تنبيه المخزون في لوحة التحكم', async ({ page }) => {
    await page.goto('/');
    
    // التحقق من وجود قسم تنبيهات المخزون
    const alertsSection = page.locator('[data-testid="stock-alerts"]');
    await expect(alertsSection).toBeVisible();
  });
});