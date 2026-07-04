const CACHE = 'crave-v2';
const STATIC_ASSETS = [
  '/',
  '/menu',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Reject caching requests with Authorization header (sensitive data)
  if (request.headers.get('Authorization')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Never cache API responses (may contain sensitive data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Never cache Firestore requests
  if (url.hostname.includes('firestore') || url.hostname.includes('firebaseio')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Never cache auth, admin, payment, or profile pages
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/checkout') || url.pathname.startsWith('/profile') ||
      url.pathname.startsWith('/orders') || url.pathname.startsWith('/rewards') ||
      url.pathname.startsWith('/order/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Never cache Google API / Firebase Auth requests
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') ||
      url.hostname.includes('razorpay.com')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Cache static assets (styles, scripts, fonts, images)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigations: network-first for fresh content
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const notification = data.notification || data;
    event.waitUntil(
      self.registration.showNotification(notification.title || 'Crave', {
        body: notification.body || '',
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        vibrate: [200, 100, 200],
        data: notification.data || {},
      })
    );
  } catch {
    const title = 'Crave';
    const body = event.data.text();
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/orders';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      const matched = clientsList.find((c) => c.url === urlToOpen);
      if (matched) {
        matched.focus();
      } else {
        clients.openWindow(urlToOpen);
      }
    })
  );
});
