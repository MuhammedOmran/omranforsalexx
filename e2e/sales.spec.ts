import { test, expect } from '@playwright/test';

test.describe('إدارة المبيعات', () => {
  test.beforeEach(async ({ page }) => {
    // تسجيل الدخول قبل كل اختبار
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@omran.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('يمكن عرض قائمة فواتير المبيعات', async ({ page }) => {
    await page.goto('/sales/invoices');
    
    await expect(page.locator('h1')).toContainText('فواتير المبيعات');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: /إضافة فاتورة/ })).toBeVisible();
  });

  test('يمكن إنشاء فاتورة مبيعات جديدة', async ({ page }) => {
    await page.goto('/sales/invoices/new');
    
    await expect(page.locator('h1')).toContainText('فاتورة مبيعات جديدة');
    
    // ملء بيانات العميل
    await page.fill('input[placeholder*="اسم العميل"]', 'عميل تجريبي');
    
    // إضافة منتج
    await page.click('button:has-text("إضافة منتج")');
    await page.fill('input[placeholder*="اسم المنتج"]', 'منتج تجريبي');
    await page.fill('input[placeholder*="الكمية"]', '2');
    await page.fill('input[placeholder*="السعر"]', '100');
    
    // حفظ الفاتورة
    await page.click('button:has-text("حفظ الفاتورة")');
    
    // التحقق من الحفظ
    await expect(page.locator('[role="alert"]:has-text("تم حفظ الفاتورة")')).toBeVisible();
  });

  test('يمكن البحث في الفواتير', async ({ page }) => {
    await page.goto('/sales/invoices');
    
    const searchInput = page.locator('input[placeholder*="بحث"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('عميل تجريبي');
    
    // التحقق من تطبيق الفلتر
    await page.waitForTimeout(500); // انتظار تطبيق البحث
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toContainText('عميل تجريبي');
  });

  test('يمكن تصدير الفواتير', async ({ page }) => {
    await page.goto('/sales/invoices');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('invoices');
  });
});