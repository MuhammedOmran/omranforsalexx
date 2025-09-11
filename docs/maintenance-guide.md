# دليل التشغيل والصيانة - نظام عُمران

## جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [متطلبات النظام](#متطلبات-النظام)
3. [التثبيت والإعداد](#التثبيت-والإعداد)
4. [المراقبة والأداء](#المراقبة-والأداء)
5. [النسخ الاحتياطي](#النسخ-الاحتياطي)
6. [الصيانة الدورية](#الصيانة-الدورية)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)
8. [الأمان](#الأمان)
9. [التحديثات](#التحديثات)
10. [إجراءات الطوارئ](#إجراءات-الطوارئ)

## نظرة عامة

نظام عُمران هو تطبيق ويب متقدم مصمم للعمل بشكل موثوق في بيئات مختلفة. هذا الدليل يوفر المعلومات اللازمة للمسؤولين التقنيين لضمان التشغيل الأمثل للنظام.

### البنية التقنية
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Storage**: localStorage محسن مع تشفير
- **PWA**: Service Worker للعمل أوف لاين

## متطلبات النظام

### متطلبات الخادم (إن وجدت)

#### الحد الأدنى
- **المعالج**: 2 CPU cores
- **الذاكرة**: 4GB RAM
- **التخزين**: 20GB SSD
- **الشبكة**: 100 Mbps

#### الموصى به
- **المعالج**: 4+ CPU cores
- **الذاكرة**: 8GB+ RAM
- **التخزين**: 50GB+ SSD
- **الشبكة**: 1 Gbps

### متطلبات المتصفح

#### المتصفحات المدعومة
- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

#### الإعدادات المطلوبة
- JavaScript مُفعل
- LocalStorage مُفعل
- الكوكيز مُفعلة
- Service Workers مدعوم

### متطلبات جهاز المستخدم

#### المكتب
- **نظام التشغيل**: Windows 10+, macOS 10.15+, Linux
- **الذاكرة**: 4GB+ RAM
- **المساحة**: 500MB متاحة للتخزين المحلي

#### الأجهزة المحمولة
- **iOS**: 13+
- **Android**: 8+ (API 26+)
- **الذاكرة**: 2GB+ RAM

## التثبيت والإعداد

### إعداد بيئة التطوير

#### 1. استنساخ المشروع
```bash
git clone [repository-url]
cd omran-system
```

#### 2. تثبيت التبعيات
```bash
# باستخدام npm
npm install

# أو باستخدام yarn
yarn install

# أو باستخدام pnpm
pnpm install
```

#### 3. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env.local
cp .env.example .env.local

# تحرير المتغيرات
VITE_APP_NAME="عُمران"
VITE_APP_VERSION="1.0.0"
VITE_ENVIRONMENT="development"
```

#### 4. تشغيل التطبيق
```bash
# تطوير
npm run dev

# بناء الإنتاج
npm run build

# معاينة البناء
npm run preview
```

### إعداد بيئة الإنتاج

#### 1. بناء التطبيق
```bash
# بناء محسن للإنتاج
npm run build

# التحقق من البناء
npm run preview
```

#### 2. إعداد الخادم
```nginx
# إعداد Nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name omran.example.com;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    
    # PWA Support
    location /manifest.json {
        add_header Cache-Control "public, max-age=0";
    }
    
    location /sw.js {
        add_header Cache-Control "no-cache";
    }
    
    # Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main Application
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
```

#### 3. إعداد CDN (اختياري)
```bash
# تحسين الأداء باستخدام CDN
# رفع الملفات الثابتة إلى CDN
aws s3 sync ./dist/assets s3://your-cdn-bucket/assets --cache-control max-age=31536000
```

## المراقبة والأداء

### مراقبة الأداء

#### 1. مقاييس الأداء الأساسية
```typescript
// في التطبيق - مراقبة الأداء
const performanceMetrics = {
  // وقت تحميل الصفحة
  pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  
  // وقت تفاعل المستخدم الأول
  firstInteraction: performance.timing.domInteractive - performance.timing.navigationStart,
  
  // استخدام الذاكرة
  memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
  
  // حجم التخزين المحلي
  localStorageSize: new Blob(Object.values(localStorage)).size
};
```

#### 2. إعداد مراقبة تلقائية
```typescript
// مراقبة الأخطاء
window.addEventListener('error', (event) => {
  console.error('خطأ في التطبيق:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
  
  // إرسال التقرير للخادم (إذا كان متاحاً)
  sendErrorReport({
    type: 'javascript_error',
    message: event.message,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
});

// مراقبة الوعود المرفوضة
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejection غير معالج:', event.reason);
  sendErrorReport({
    type: 'unhandled_promise_rejection',
    reason: event.reason,
    timestamp: new Date().toISOString()
  });
});
```

### تحسين الأداء

#### 1. مراقبة استخدام الذاكرة
```bash
# سكريبت مراقبة الذاكرة
#!/bin/bash
while true; do
    echo "$(date): Memory usage check"
    # التحقق من استخدام الذاكرة
    ps aux | grep node | grep -v grep
    sleep 300 # كل 5 دقائق
done
```

#### 2. تحسين التخزين المحلي
```typescript
// تنظيف دوري للتخزين المحلي
function performStorageCleanup() {
  const storage = localStorage;
  const threshold = 5 * 1024 * 1024; // 5MB
  
  let totalSize = 0;
  for (let key in storage) {
    totalSize += storage[key].length;
  }
  
  if (totalSize > threshold) {
    // حذف البيانات القديمة
    const keys = Object.keys(storage).sort((a, b) => {
      const aTime = JSON.parse(storage[a])?.timestamp || 0;
      const bTime = JSON.parse(storage[b])?.timestamp || 0;
      return aTime - bTime;
    });
    
    // حذف 10% من البيانات الأقدم
    const keysToDelete = keys.slice(0, Math.floor(keys.length * 0.1));
    keysToDelete.forEach(key => storage.removeItem(key));
  }
}

// تنفيذ التنظيف كل ساعة
setInterval(performStorageCleanup, 3600000);
```

## النسخ الاحتياطي

### استراتيجية النسخ الاحتياطي

#### 1. النسخ التلقائي
```typescript
// نظام النسخ الاحتياطي التلقائي
class BackupManager {
  private static instance: BackupManager;
  
  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }
  
  // إنشاء نسخة احتياطية
  createBackup(): string {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: this.getAllData()
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  // جدولة النسخ الاحتياطي
  scheduleBackups() {
    // نسخة احتياطية يومية
    setInterval(() => {
      const backup = this.createBackup();
      this.saveBackup(backup, 'daily');
    }, 24 * 60 * 60 * 1000);
    
    // نسخة احتياطية أسبوعية
    setInterval(() => {
      const backup = this.createBackup();
      this.saveBackup(backup, 'weekly');
    }, 7 * 24 * 60 * 60 * 1000);
  }
  
  private saveBackup(data: string, type: string) {
    const filename = `backup_${type}_${new Date().toISOString().split('T')[0]}.json`;
    
    // حفظ محلي
    localStorage.setItem(`__backup_${type}__`, data);
    
    // تنزيل تلقائي (للنسخ المهمة)
    if (type === 'weekly') {
      this.downloadBackup(data, filename);
    }
  }
  
  private downloadBackup(data: string, filename: string) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}
```

#### 2. استعادة النسخ الاحتياطية
```typescript
// استعادة البيانات
function restoreFromBackup(backupData: string): boolean {
  try {
    const parsed = JSON.parse(backupData);
    
    // التحقق من صحة البيانات
    if (!parsed.data || !parsed.timestamp || !parsed.version) {
      throw new Error('ملف النسخة الاحتياطية غير صحيح');
    }
    
    // نسخة احتياطية من البيانات الحالية
    const currentBackup = BackupManager.getInstance().createBackup();
    localStorage.setItem('__restore_backup__', currentBackup);
    
    // استعادة البيانات
    Object.entries(parsed.data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    
    return true;
  } catch (error) {
    console.error('فشل في استعادة النسخة الاحتياطية:', error);
    return false;
  }
}
```

### خطة النسخ الاحتياطي

#### الجدولة الزمنية
- **تلقائي**: كل تغيير مهم في البيانات
- **يومي**: نهاية كل يوم عمل
- **أسبوعي**: نهاية كل أسبوع
- **شهري**: نهاية كل شهر
- **طوارئ**: قبل التحديثات المهمة

#### أماكن التخزين
1. **محلي**: localStorage
2. **تنزيل**: ملفات JSON
3. **سحابي**: خدمات التخزين السحابي (اختياري)

## الصيانة الدورية

### المهام اليومية

#### 1. فحص الأداء
```bash
#!/bin/bash
# سكريبت فحص يومي

echo "=== فحص الأداء اليومي - $(date) ==="

# فحص استخدام التخزين
echo "استخدام التخزين المحلي:"
du -sh ~/.local/share/applications/omran/ 2>/dev/null || echo "لا توجد بيانات محلية"

# فحص سجلات الأخطاء
echo "الأخطاء الحديثة:"
journalctl --since="24 hours ago" | grep -i error | tail -10

# فحص الذاكرة
echo "استخدام الذاكرة:"
free -h

echo "=== انتهى الفحص اليومي ==="
```

#### 2. تنظيف البيانات المؤقتة
```typescript
// تنظيف يومي للبيانات
function dailyCleanup() {
  // حذف البيانات المؤقتة
  const tempKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('temp_') || 
    key.startsWith('cache_')
  );
  
  tempKeys.forEach(key => {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    if (data.timestamp && data.timestamp < dayAgo) {
      localStorage.removeItem(key);
    }
  });
  
  // تحسين أداء التخزين
  if (typeof Storage !== 'undefined') {
    // إعادة تنظيم التخزين
    const allData = { ...localStorage };
    localStorage.clear();
    Object.entries(allData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }
}

// تشغيل التنظيف اليومي
setInterval(dailyCleanup, 24 * 60 * 60 * 1000);
```

### المهام الأسبوعية

#### 1. فحص شامل للنظام
```bash
#!/bin/bash
# فحص أسبوعي شامل

echo "=== الفحص الأسبوعي - $(date) ==="

# فحص أمان التطبيق
echo "فحص الأمان:"
# التحقق من الشهادات
openssl x509 -in /path/to/certificate.crt -text -noout | grep "Not After"

# فحص الأداء
echo "إحصائيات الأداء:"
# مقاييس الأداء الأسبوعية
cat /var/log/nginx/access.log | grep "$(date -d '7 days ago' '+%d/%b/%Y')" | wc -l

# فحص النسخ الاحتياطية
echo "حالة النسخ الاحتياطية:"
ls -la /path/to/backups/ | tail -10

echo "=== انتهى الفحص الأسبوعي ==="
```

#### 2. تحسين قاعدة البيانات
```typescript
// تحسين أسبوعي للبيانات
function weeklyOptimization() {
  // ضغط البيانات القديمة
  const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  // أرشفة البيانات القديمة
  const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
  const oldInvoices = invoices.filter(inv => new Date(inv.createdAt).getTime() < oneMonthAgo);
  const recentInvoices = invoices.filter(inv => new Date(inv.createdAt).getTime() >= oneMonthAgo);
  
  // حفظ الفواتير القديمة في أرشيف
  if (oldInvoices.length > 0) {
    const archive = JSON.parse(localStorage.getItem('archived_invoices') || '[]');
    localStorage.setItem('archived_invoices', JSON.stringify([...archive, ...oldInvoices]));
    localStorage.setItem('invoices', JSON.stringify(recentInvoices));
  }
  
  // إحصائيات الأداء
  console.log(`تم أرشفة ${oldInvoices.length} فاتورة قديمة`);
}
```

### المهام الشهرية

#### 1. تحديث النظام
```bash
#!/bin/bash
# تحديث شهري

echo "=== التحديث الشهري - $(date) ==="

# تحديث التبعيات
npm audit
npm update

# إنشاء نسخة احتياطية كاملة
npm run backup:full

# اختبار التطبيق
npm run test
npm run build

echo "=== انتهى التحديث الشهري ==="
```

#### 2. مراجعة الأمان
```typescript
// مراجعة أمان شهرية
function monthlySecurityReview() {
  // فحص البيانات الحساسة
  const sensitiveKeys = Object.keys(localStorage).filter(key => 
    key.includes('password') || 
    key.includes('token') || 
    key.includes('secret')
  );
  
  if (sensitiveKeys.length > 0) {
    console.warn('تحذير: يتم تخزين بيانات حساسة في localStorage:', sensitiveKeys);
  }
  
  // تحديث كلمات المرور الافتراضية
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const defaultPasswords = users.filter(user => 
    user.password === 'admin123' || 
    user.password === 'password' || 
    user.password === '123456'
  );
  
  if (defaultPasswords.length > 0) {
    console.warn('تحذير: يوجد مستخدمون بكلمات مرور افتراضية');
  }
}
```

## استكشاف الأخطاء

### الأخطاء الشائعة

#### 1. مشاكل التخزين
```typescript
// تشخيص مشاكل التخزين
function diagnoseStorageIssues() {
  try {
    // فحص توفر localStorage
    if (typeof Storage === 'undefined') {
      throw new Error('localStorage غير مدعوم في هذا المتصفح');
    }
    
    // فحص المساحة المتاحة
    let totalSize = 0;
    for (let key in localStorage) {
      totalSize += localStorage[key].length;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (totalSize > maxSize * 0.9) {
      console.warn('تحذير: التخزين المحلي ممتلئ تقريباً');
      return 'storage_almost_full';
    }
    
    // اختبار الكتابة
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    return 'storage_ok';
    
  } catch (error) {
    console.error('خطأ في التخزين:', error);
    return 'storage_error';
  }
}
```

#### 2. مشاكل الأداء
```typescript
// تشخيص مشاكل الأداء
function diagnosePerformanceIssues() {
  const metrics = {
    // وقت تحميل الصفحة
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    
    // استخدام الذاكرة
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
    
    // عدد العناصر في DOM
    domElements: document.querySelectorAll('*').length,
    
    // حجم localStorage
    localStorageSize: new Blob(Object.values(localStorage)).size
  };
  
  const issues = [];
  
  if (metrics.loadTime > 5000) {
    issues.push('وقت تحميل بطيء');
  }
  
  if (metrics.memoryUsage > 100 * 1024 * 1024) {
    issues.push('استخدام ذاكرة مرتفع');
  }
  
  if (metrics.domElements > 1000) {
    issues.push('عدد عناصر DOM مرتفع');
  }
  
  if (metrics.localStorageSize > 5 * 1024 * 1024) {
    issues.push('حجم التخزين المحلي مرتفع');
  }
  
  return { metrics, issues };
}
```

### حلول الطوارئ

#### 1. إعادة تعيين النظام
```typescript
// إعادة تعيين كاملة للنظام
function emergencyReset() {
  const confirmation = confirm(
    'هذا سيؤدي إلى حذف جميع البيانات! هل أنت متأكد؟'
  );
  
  if (!confirmation) return false;
  
  try {
    // إنشاء نسخة احتياطية طارئة
    const backup = JSON.stringify({
      timestamp: new Date().toISOString(),
      data: { ...localStorage }
    });
    
    // محاولة تنزيل النسخة الاحتياطية
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency_backup_${Date.now()}.json`;
    a.click();
    
    // مسح جميع البيانات
    localStorage.clear();
    sessionStorage.clear();
    
    // إعادة تحميل الصفحة
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('فشل في إعادة تعيين النظام:', error);
    return false;
  }
}
```

#### 2. وضع الطوارئ
```typescript
// تفعيل وضع الطوارئ
function enableEmergencyMode() {
  localStorage.setItem('emergency_mode', 'true');
  
  // تعطيل الميزات غير الضرورية
  const features = [
    'auto_sync',
    'performance_monitoring',
    'analytics',
    'notifications'
  ];
  
  features.forEach(feature => {
    localStorage.setItem(`disable_${feature}`, 'true');
  });
  
  // تنظيف فوري للذاكرة
  if (typeof (window as any).gc === 'function') {
    (window as any).gc();
  }
  
  console.log('تم تفعيل وضع الطوارئ');
}
```

## الأمان

### تأمين البيانات

#### 1. تشفير البيانات الحساسة
```typescript
// نظام تشفير بسيط للبيانات الحساسة
class EncryptionManager {
  private static key = 'omran_encryption_key_2024';
  
  static encrypt(data: string): string {
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch {
      return data;
    }
  }
  
  static decrypt(encryptedData: string): string {
    try {
      return decodeURIComponent(escape(atob(encryptedData)));
    } catch {
      return encryptedData;
    }
  }
  
  // تشفير كائن كامل
  static encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }
  
  // فك تشفير كائن
  static decryptObject(encryptedData: string): any {
    try {
      return JSON.parse(this.decrypt(encryptedData));
    } catch {
      return null;
    }
  }
}
```

#### 2. مراجعة الأمان
```typescript
// فحص أمان دوري
function securityAudit() {
  const issues = [];
  
  // فحص البيانات غير المشفرة
  const sensitiveKeys = ['users', 'passwords', 'tokens'];
  sensitiveKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data && !data.startsWith('encrypted_')) {
      issues.push(`البيانات الحساسة غير مشفرة: ${key}`);
    }
  });
  
  // فحص كلمات المرور الضعيفة
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const weakPasswords = users.filter(user => 
    user.password && user.password.length < 8
  );
  
  if (weakPasswords.length > 0) {
    issues.push(`${weakPasswords.length} مستخدم بكلمة مرور ضعيفة`);
  }
  
  return issues;
}
```

### حماية من الهجمات

#### 1. حماية من XSS
```typescript
// تنظيف النصوص من محاولات XSS
function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// التحقق من صحة البيانات
function validateInput(data: any, schema: any): boolean {
  // تطبيق التحقق حسب النوع
  if (schema.type === 'string' && typeof data !== 'string') {
    return false;
  }
  
  if (schema.required && !data) {
    return false;
  }
  
  if (schema.maxLength && data.length > schema.maxLength) {
    return false;
  }
  
  return true;
}
```

## التحديثات

### نظام التحديث التلقائي

#### 1. فحص التحديثات
```typescript
// فحص التحديثات المتاحة
async function checkForUpdates(): Promise<boolean> {
  try {
    // في بيئة الإنتاج، يمكن فحص من خادم
    const currentVersion = '1.0.0';
    
    // محاكاة فحص التحديث
    const response = await fetch('/api/version', { 
      method: 'GET',
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.version !== currentVersion;
    }
    
    return false;
  } catch {
    return false;
  }
}
```

#### 2. تطبيق التحديثات
```typescript
// تطبيق التحديث
async function applyUpdate(): Promise<boolean> {
  try {
    // إنشاء نسخة احتياطية قبل التحديث
    const backup = BackupManager.getInstance().createBackup();
    localStorage.setItem('pre_update_backup', backup);
    
    // تحديث Service Worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
    
    // إعادة تحميل التطبيق
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('فشل في تطبيق التحديث:', error);
    return false;
  }
}
```

### خطة التحديثات

#### جدولة التحديثات
- **تحديثات الأمان**: فوراً
- **إصلاحات الأخطاء**: أسبوعياً
- **ميزات جديدة**: شهرياً
- **تحديثات كبيرة**: ربع سنوياً

#### اختبار التحديثات
1. **بيئة التطوير**: اختبار شامل
2. **بيئة التجريب**: اختبار مع بيانات حقيقية
3. **الإنتاج**: تطبيق تدريجي

## إجراءات الطوارئ

### خطة استمرارية العمل

#### 1. في حالة تعطل النظام
```bash
#!/bin/bash
# خطة الطوارئ

echo "=== إجراءات الطوارئ ==="

# 1. تشخيص سريع
echo "تشخيص المشكلة..."
curl -I https://omran.example.com/ || echo "الموقع غير متاح"

# 2. التحقق من النسخ الاحتياطية
echo "فحص النسخ الاحتياطية..."
ls -la /path/to/backups/ | tail -5

# 3. إعادة تشغيل الخدمات
echo "إعادة تشغيل الخدمات..."
sudo systemctl restart nginx
sudo systemctl restart omran-app

# 4. إشعار الفريق
echo "إشعار فريق الدعم..."
# curl -X POST webhook-url -d "النظام متوقف - تم بدء إجراءات الطوارئ"

echo "=== انتهت إجراءات الطوارئ ==="
```

#### 2. خطة الاستعادة
```typescript
// خطة استعادة النظام
class DisasterRecovery {
  static async restoreSystem(): Promise<boolean> {
    try {
      console.log('بدء عملية استعادة النظام...');
      
      // 1. استعادة من النسخة الاحتياطية الأحدث
      const latestBackup = this.getLatestBackup();
      if (latestBackup) {
        const restored = restoreFromBackup(latestBackup);
        if (restored) {
          console.log('تم استعادة البيانات من النسخة الاحتياطية');
        }
      }
      
      // 2. إعادة تهيئة النظام
      await this.reinitializeSystem();
      
      // 3. التحقق من سلامة البيانات
      const integrity = await this.checkDataIntegrity();
      if (!integrity) {
        throw new Error('فشل في التحقق من سلامة البيانات');
      }
      
      // 4. إعادة تشغيل الخدمات
      await this.restartServices();
      
      console.log('تم استعادة النظام بنجاح');
      return true;
      
    } catch (error) {
      console.error('فشل في استعادة النظام:', error);
      return false;
    }
  }
  
  private static getLatestBackup(): string | null {
    const backups = [
      localStorage.getItem('__backup_daily__'),
      localStorage.getItem('__backup_weekly__'),
      localStorage.getItem('pre_update_backup')
    ].filter(Boolean);
    
    return backups[0] || null;
  }
  
  private static async reinitializeSystem(): Promise<void> {
    // إعادة تهيئة التطبيق
    window.location.reload();
  }
  
  private static async checkDataIntegrity(): Promise<boolean> {
    try {
      // فحص البيانات الأساسية
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      
      return Array.isArray(products) && 
             Array.isArray(customers) && 
             Array.isArray(invoices);
    } catch {
      return false;
    }
  }
  
  private static async restartServices(): Promise<void> {
    // إعادة تشغيل الخدمات المحلية
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  }
}
```

### جهات الاتصال في الطوارئ

#### فريق التطوير
- **مطور رئيسي**: [رقم الهاتف]
- **مدير التقنية**: [رقم الهاتف]
- **دعم فني**: support@omran.app

#### خطة التصعيد
1. **المستوى 1**: مدير النظام المحلي
2. **المستوى 2**: فريق الدعم التقني
3. **المستوى 3**: فريق التطوير
4. **المستوى 4**: الإدارة العليا

---

**هذا الدليل يوفر جميع المعلومات اللازمة للصيانة والتشغيل الآمن لنظام عُمران. يجب مراجعة هذا الدليل دورياً وتحديثه حسب التطورات.**

*تاريخ آخر تحديث: [التاريخ الحالي]*
*إصدار الدليل: 1.0*