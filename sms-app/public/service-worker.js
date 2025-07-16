// SMS Maintenance Portal Service Worker
// Version: 1.0.0
// Enables offline functionality for critical features

const CACHE_NAME = 'sms-maintenance-v1';
const SYNC_TAG = 'sms-sync-data';

// Critical assets to cache for offline use
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache responses
const CACHEABLE_API_PATTERNS = [
  /\/api\/equipment\/?$/,
  /\/api\/equipment\/\d+$/,
  /\/api\/vessels\/?$/,
  /\/api\/vessels\/\d+$/,
  /\/api\/faults\/?$/,
  /\/api\/users\/profile$/,
  /\/api\/certificate-warnings\/summary$/,
  /\/api\/notifications\/?$/
];

// API endpoints that should work offline with queuing
const OFFLINE_QUEUE_PATTERNS = [
  /\/api\/faults$/,
  /\/api\/faults\/\d+$/,
  /\/api\/equipment\/\d+$/,
  /\/api\/maintenance-logs$/,
  /\/api\/notifications\/\d+\/read$/
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Install complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activate complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement offline strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this is a cacheable GET request
  if (request.method === 'GET' && shouldCacheApiResponse(url.pathname)) {
    try {
      // Try network first
      const networkResponse = await fetch(request);
      
      // Cache successful responses
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // If network fails, try cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[ServiceWorker] Serving from cache:', url.pathname);
        return cachedResponse;
      }
      
      // Return offline response
      return createOfflineApiResponse();
    }
  }
  
  // Handle POST/PUT/DELETE requests that should queue when offline
  if (shouldQueueOffline(request)) {
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch (error) {
      // Queue the request for later sync
      await queueOfflineRequest(request);
      return createQueuedResponse();
    }
  }
  
  // For other requests, just try network
  try {
    return await fetch(request);
  } catch (error) {
    return createOfflineApiResponse();
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  try {
    // Try network first for HTML pages (to get fresh content)
    if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
      try {
        const networkResponse = await fetch(request);
        
        // Update cache with fresh response
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Fall back to cache for HTML
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return cached index.html for navigation requests
        return caches.match('/index.html');
      }
    }
    
    // For other static assets, try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached response or offline page
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse();
  }
}

// Check if API response should be cached
function shouldCacheApiResponse(pathname) {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(pathname));
}

// Check if request should be queued when offline
function shouldQueueOffline(request) {
  if (request.method === 'GET') return false;
  
  const url = new URL(request.url);
  return OFFLINE_QUEUE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Queue offline request for later sync
async function queueOfflineRequest(request) {
  const db = await openOfflineDB();
  const tx = db.transaction('offline_queue', 'readwrite');
  const store = tx.objectStore('offline_queue');
  
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  await store.add(requestData);
  
  // Register for background sync if available
  if ('sync' in self.registration) {
    await self.registration.sync.register(SYNC_TAG);
  }
}

// Open IndexedDB for offline queue
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sms_offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline_queue')) {
        const store = db.createObjectStore('offline_queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[ServiceWorker] Starting background sync');
    event.waitUntil(syncOfflineQueue());
  }
});

// Sync offline queue
async function syncOfflineQueue() {
  const db = await openOfflineDB();
  const tx = db.transaction('offline_queue', 'readwrite');
  const store = tx.objectStore('offline_queue');
  const requests = await store.getAll();
  
  console.log(`[ServiceWorker] Syncing ${requests.length} offline requests`);
  
  for (const requestData of requests) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.method !== 'GET' ? requestData.body : undefined
      });
      
      if (response.ok) {
        // Remove from queue if successful
        await store.delete(requestData.id);
        console.log('[ServiceWorker] Synced request:', requestData.url);
        
        // Notify clients of successful sync
        await notifyClients('sync-success', {
          url: requestData.url,
          method: requestData.method
        });
      }
    } catch (error) {
      console.error('[ServiceWorker] Sync failed for:', requestData.url, error);
    }
  }
  
  // Check if any requests remain
  const remaining = await store.count();
  if (remaining > 0) {
    console.log(`[ServiceWorker] ${remaining} requests still pending`);
    // Re-register sync for retry
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_TAG);
    }
  }
}

// Notify all clients of an event
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type,
      data,
      timestamp: Date.now()
    });
  });
}

// Create offline API response
function createOfflineApiResponse() {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. This data may be outdated.',
      offline: true
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Response': 'true'
      }
    }
  );
}

// Create queued response
function createQueuedResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      queued: true,
      message: 'Your request has been queued and will be processed when you are back online.'
    }),
    {
      status: 202,
      headers: {
        'Content-Type': 'application/json',
        'X-Queued-Response': 'true'
      }
    }
  );
}

// Create generic offline response
function createOfflineResponse() {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - SMS Maintenance Portal</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .offline-container {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-width: 400px;
        }
        h1 { color: #333; margin-bottom: 1rem; }
        p { color: #666; line-height: 1.5; }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Don't worry - you can still view cached data and any changes you make will be synced when you're back online.</p>
      </div>
    </body>
    </html>
    `,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-Offline-Response': 'true'
      }
    }
  );
}

// Periodic sync for better offline support
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sms-content-sync') {
    event.waitUntil(updateCachedContent());
  }
});

// Update cached content periodically
async function updateCachedContent() {
  const cache = await caches.open(CACHE_NAME);
  
  // List of important endpoints to keep fresh
  const endpoints = [
    '/api/equipment',
    '/api/vessels',
    '/api/faults',
    '/api/certificate-warnings/summary',
    '/api/notifications'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        await cache.put(endpoint, response);
        console.log('[ServiceWorker] Updated cache for:', endpoint);
      }
    } catch (error) {
      console.log('[ServiceWorker] Failed to update cache for:', endpoint);
    }
  }
}