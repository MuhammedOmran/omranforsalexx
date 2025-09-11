import { test, expect } from '@playwright/test';

test.describe('لوحة التحكم', () => {
  test.beforeEach(async ({ page }) => {
    // تسجيل الدخول
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@omran.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('تعرض العناصر الأساسية للوحة التحكم', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('لوحة التحكم');
    
    // KPI Cards
    await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible();
    
    // Quick Actions
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    
    // Charts
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
    
    // Stock Alerts
    await expect(page.locator('[data-testid="stock-alerts"]')).toBeVisible();
    
    // Recent Transactions
    await expect(page.locator('[data-testid="recent-transactions"]')).toBeVisible();
  });

  test('تعرض الوقت والتاريخ الحالي', async ({ page }) => {
    const timeElement = page.locator('[data-testid="current-time"]');
    const dateElement = page.locator('[data-testid="current-date"]');
    
    await expect(timeElement).toBeVisible();
    await expect(dateElement).toBeVisible();
    
    // التحقق من أن الوقت يتحدث (انتظار ثانية واحدة)
    const initialTime = await timeElement.textContent();
    await page.waitForTimeout(1100);
    const updatedTime = await timeElement.textContent();
    
    expect(initialTime).not.toBe(updatedTime);
  });

  test('تعمل الإجراءات السريعة', async ({ page }) => {
    // فاتورة مبيعات جديدة
    await page.click('[data-testid="quick-action-new-sale"]');
    await expect(page).toHaveURL('/sales/invoices/new');
    
    await page.goBack();
    
    // منتج جديد
    await page.click('[data-testid="quick-action-new-product"]');
    await expect(page).toHaveURL('/inventory/products/new');
    
    await page.goBack();
    
    // عميل جديد
    await page.click('[data-testid="quick-action-new-customer"]');
    await expect(page).toHaveURL('/sales/customers/new');
  });

  test('تعرض بيانات KPI بشكل صحيح', async ({ page }) => {
    const kpiCards = page.locator('[data-testid="kpi-cards"] .card');
    
    // التحقق من وجود 4 بطاقات KPI على الأقل
    await expect(kpiCards).toHaveCount(4);
    
    // التحقق من احتوائها على أرقام
    for (let i = 0; i < 4; i++) {
      const card = kpiCards.nth(i);
      const value = card.locator('.text-2xl, .text-3xl');
      await expect(value).toBeVisible();
    }
  });

  test('يمكن التنقل بين الأقسام من الشريط الجانبي', async ({ page }) => {
    // المبيعات
    await page.click('nav a:has-text("المبيعات")');
    await page.click('nav a:has-text("فواتير المبيعات")');
    await expect(page).toHaveURL('/sales/invoices');
    
    // المخزون
    await page.click('nav a:has-text("المخزون")');
    await page.click('nav a:has-text("المنتجات")');
    await expect(page).toHaveURL('/inventory/products');
    
    // التقارير
    await page.click('nav a:has-text("التقارير")');
    await page.click('nav a:has-text("تقرير الأرباح")');
    await expect(page).toHaveURL('/reports/profit');
  });

  test('تستجيب للشاشات الصغيرة', async ({ page }) => {
    // تغيير حجم الشاشة للجوال
    await page.setViewportSize({ width: 375, height: 667 });
    
    // التحقق من أن القائمة مخفية
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).not.toBeVisible();
    
    // فتح القائمة الجانبية
    await page.click('[data-testid="mobile-menu-trigger"]');
    await expect(sidebar).toBeVisible();
  });
});