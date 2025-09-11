import { test, expect } from '@playwright/test';

test.describe('مصادقة المستخدم', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('يعرض صفحة تسجيل الدخول للمستخدم غير المسجل', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText('تسجيل الدخول');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /تسجيل الدخول/ })).toBeVisible();
  });

  test('يسمح بتسجيل الدخول بالبيانات الصحيحة', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'admin@omran.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // التحقق من الانتقال للوحة التحكم
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('لوحة التحكم');
  });

  test('يظهر رسالة خطأ للبيانات الخاطئة', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // التحقق من ظهور رسالة الخطأ
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('يمكن تسجيل الخروج', async ({ page }) => {
    // تسجيل الدخول أولاً
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@omran.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // تسجيل الخروج
    await page.click('[data-testid="user-menu"]');
    await page.click('text=تسجيل الخروج');
    
    // التحقق من الانتقال لصفحة تسجيل الدخول
    await expect(page).toHaveURL('/login');
  });
});