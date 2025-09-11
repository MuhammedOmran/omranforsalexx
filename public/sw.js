// Service Worker محسن للأداء
// Version 1.1 - OMRAN FOR SALE

const CACHE_NAME = 'omran-v2.0.0';
const STATIC_CACHE = 'omran-static-v2.0.0';
const DYNAMIC_CACHE = 'omran-dynamic-v2.0.0';
const API_CACHE = 'omran-api-v2.0.0';

// Files to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/omran-latest-logo.png',
  '/favicon.ico',
  // Essential pages for offline functionality
  '/sales/dashboard',
  '/sales/invoices',
  '/inventory/products',
  '/cash-register'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(CACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event محسن - استراتيجية cache متقدمة
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // استراتيجية Cache First للملفات الثابتة
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // استراتيجية Network First للصفحات والAPI
  if (request.destination === 'document' || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Stale While Revalidate للباقي
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// استراتيجية Cache First
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// استراتيجية Network First
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    if (request.destination === 'document') {
      return caches.match('/index.html');
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'هذا التطبيق يعمل في الوضع الأوف لاين' 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

// استراتيجية Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'data-sync') {
    event.waitUntil(
      // Sync local data when connection is restored
      syncLocalData()
    );
  }
});

// Handle message events from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // Update cache with new data
    event.waitUntil(updateCache());
  }
});

// Function to sync local data (placeholder for future implementation)
async function syncLocalData() {
  try {
    console.log('Service Worker: Syncing local data...');
    // This is where we would sync localStorage data with a server
    // For now, we just log that sync would happen here
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Data sync failed:', error);
  }
}

// Function to update cache
async function updateCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Update cached resources
    return Promise.all(
      requests.map(request => {
        return fetch(request)
          .then(response => {
            if (response.status === 200) {
              return cache.put(request, response);
            }
          })
          .catch(() => {
            // Ignore errors, keep old cached version
          });
      })
    );
  } catch (error) {
    console.error('Service Worker: Cache update failed:', error);
  }
}

// تنظيف cache محسن
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  return Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName.startsWith('omran-') && !currentCaches.includes(cacheName)) {
        console.log('Service Worker: Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

// تنظيف cache حسب الحجم
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  if (requests.length > maxItems) {
    // حذف العناصر الأقدم
    const itemsToDelete = requests.slice(0, requests.length - maxItems);
    await Promise.all(itemsToDelete.map(request => cache.delete(request)));
  }
}

// إشعارات Push محسنة
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من عمران للمبيعات',
    icon: '/omran-latest-logo.png',
    badge: '/omran-latest-logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Math.random()
    },
    actions: [
      {
        action: 'view',
        title: 'عرض',
        icon: '/omran-latest-logo.png'
      },
      {
        action: 'dismiss',
        title: 'تجاهل'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('عمران للمبيعات', options)
  );
});

// التعامل مع نقر الإشعارات
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // إذا كان التطبيق مفتوح، ركز عليه
        for (const client of clientList) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        // وإلا افتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// تحسين أداء التطبيق - Background fetch
self.addEventListener('backgroundfetch', (event) => {
  console.log('Service Worker: Background fetch triggered');
  
  if (event.tag === 'data-backup') {
    event.waitUntil(handleBackgroundBackup());
  }
});

// التعامل مع النسخ الاحتياطي في الخلفية
async function handleBackgroundBackup() {
  try {
    console.log('Service Worker: Performing background backup');
    // يمكن إضافة منطق النسخ الاحتياطي هنا
    return Promise.resolve();
  } catch (error) {
    console.error('Service Worker: Background backup failed:', error);
  }
}

// تحديث تلقائي للتطبيق
self.addEventListener('updatefound', () => {
  console.log('Service Worker: Update found');
  
  const newWorker = self.registration.installing;
  newWorker.onstatechange = () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // إشعار المستخدم بوجود تحديث
      self.registration.showNotification('تحديث متاح', {
        body: 'يتوفر تحديث جديد للتطبيق. اضغط لإعادة التحميل.',
        icon: '/omran-latest-logo.png',
        badge: '/omran-latest-logo.png',
        tag: 'app-update',
        actions: [{
          action: 'update',
          title: 'تحديث الآن'
        }],
        requireInteraction: true
      });
    }
  };
});

// تنظيف دوري محسن
setInterval(() => {
  cleanupOldCaches();
  limitCacheSize(DYNAMIC_CACHE, 50);
  limitCacheSize(API_CACHE, 30);
}, 12 * 60 * 60 * 1000); // كل 12 ساعة
