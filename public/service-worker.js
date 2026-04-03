/* global self __WB_MANIFEST */
/*
  RankIt ZM - Service Worker v1.2.0
  Handles Offline Caching, Asset Management & Sync Coordination
  Updated: March 2026 - Eastern Province Edition
  
  Features:
  - Smart caching with network-first for API, cache-first for assets
  - Offline logger integration via postMessage
  - Background sync for data reconciliation
  - IndexedDB coordination
  - Enhanced offline experience
*/

const CACHE_NAME = 'rankitzm-cache-v1.2.0';
const OFFLINE_CACHE = 'rankitzm-offline-v1.2.0';
const API_CACHE = 'rankitzm-api-v1.2.0';

// Core assets to precache (app shell)
// Auto-injected by vite-plugin-pwa at build time — all hashed chunk filenames
const PRECACHE_ASSETS = self.__WB_MANIFEST || [];

// Shell assets — always needed for offline
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/shortcut-classes-192x192.png',
  '/icons/shortcut-tests-192x192.png',
  '/icons/shortcut-reports-192x192.png',
];

// API endpoints to never cache (always network)
const NEVER_CACHE_URLS = [
  '/api/sync',
  '/api/auth/login',
  '/api/auth/logout',
];

// Resource types that benefit from caching
const CACHE_ASSET_TYPES = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
];

/**
 * INSTALL EVENT
 * Pre-cache the app shell and core assets
 */
self.addEventListener('install', (event) => {
  console.log('🔧 RankIt ZM Service Worker: Installing v1.2.0...');

  event.waitUntil(
    Promise.all([
      // Pre-cache app shell
     caches.open(CACHE_NAME).then((cache) => {
  console.log('✅ Pre-caching app shell + Vite chunks');
  // Cache shell assets
  cache.addAll(SHELL_ASSETS).catch((err) => {
    console.warn('⚠️ Some shell assets failed:', err);
  });
  // Cache all Vite chunks injected at build time
  const chunkUrls = PRECACHE_ASSETS.map((entry) =>
    typeof entry === 'string' ? entry : entry.url
  );
  return Promise.allSettled(chunkUrls.map((url) => cache.add(url)));
}),
      // Create offline cache
      caches.open(OFFLINE_CACHE),
      // Create API cache
      caches.open(API_CACHE),
    ])
      .then(() => {
        console.log('✅ RankIt ZM Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('❌ Service Worker installation failed:', err);
      })
  );
});

/**
 * ACTIVATE EVENT
 * Clean up old caches and claim clients
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 RankIt ZM Service Worker: Activating...');

  const cacheAllowlist = [CACHE_NAME, OFFLINE_CACHE, API_CACHE];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheAllowlist.includes(cacheName)) {
              console.log(`🧹 Clearing old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ RankIt ZM Service Worker activated and ready');
        return self.clients.claim();
      })
      .catch((err) => {
        console.error('❌ Service Worker activation failed:', err);
      })
  );
});

/**
 * FETCH EVENT
 * Implement intelligent caching strategy:
 * - API calls: Network-first with fallback to cache
 * - Assets (JS/CSS/Images): Cache-first with network fallback
 * - Navigation: Cache-first for offline-first experience
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip non-GET requests (POST/PUT/DELETE handled by IndexedDB + sync API)
  if (request.method !== 'GET') {
    console.log(`⏭️ Skipping ${request.method} request to ${url.pathname}`);
    return;
  }

  // Determine caching strategy based on request type
  // Navigation must come FIRST
  if (request.mode === 'navigate') {
    // Navigation: Cache-first to support offline-first experience
    event.respondWith(navigationStrategy(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API calls: Network-first with cache fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (isAssetRequest(url.pathname)) {
    // Assets: Cache-first with network fallback
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Default: Cache-first
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * NETWORK-FIRST STRATEGY
 * Try network first, fallback to cache for API calls
 * Used for dynamic API endpoints
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      // Validate response
      if (!response || response.status > 399) {
        return response;
      }

      // Clone and cache successful responses
      const responseClone = response.clone();
      caches.open(API_CACHE)
        .then((cache) => {
          cache.put(request, responseClone);
        })
        .catch((err) => {
          console.warn('⚠️ Failed to cache API response:', err);
        });

      return response;
    })
    .catch((err) => {
      console.warn(`🔴 Network request failed, checking cache: ${request.url}`, err);

      // Fallback to cache
      return caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log(`✅ Serving from cache: ${request.url}`);
            return cachedResponse;
          }

          // Return offline response
          return createOfflineResponse(request);
        });
    });
}

/**
 * CACHE-FIRST STRATEGY
 * Try cache first, fallback to network for assets
 * Used for static assets and resources
 */
function cacheFirstStrategy(request) {
  // Network-first for JS chunks - cache on success, serve cache offline
  if (request.url.includes('/assets/') && request.url.endsWith('.js')) {
    return fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch((err) => {
        console.warn(`🔴 Failed to fetch JS chunk: ${request.url}`, err);
        return caches.match(request)
          .then((cached) => {
            if (cached) return cached;
            return new Response('JS chunk unavailable offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' },
            });
          });
      });
  }

  // For images and other assets, skip if they don't exist
  if (request.url.includes('/screenshots/') || request.url.includes('/icons/')) {
    return fetch(request)
      .catch((err) => {
        console.warn(`⚠️ Asset not found (optional): ${request.url}`, err);
        return caches.match(request)
          .catch(() => {
            // Return transparent 1x1 PNG for missing images
            return new Response(
              new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 177, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]),
              { headers: { 'Content-Type': 'image/png' } }
            );
          });
      });
  }

  // Standard cache-first for other assets
  return caches.match(request)
    .then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, freshResponse.clone());
                })
                .catch(() => {});
            }
          })
          .catch(() => {});

        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, response.clone());
            })
            .catch(() => {});

          return response;
        })
.catch((err) => {
          console.warn(`🔴 Failed to fetch asset: ${request.url}`, err);
          return new Response('Asset unavailable offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
    .catch((err) => {
      console.warn(`🔴 Asset fetch failed: ${request.url}`, err);
      return new Response('Asset unavailable offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    });
}
/**
 * NAVIGATION STRATEGY
 * Network-first for SPA pages, fallback to cache, then index.html
 */
function navigationStrategy(request) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status > 399) {
        return response;
      }

      const responseClone = response.clone();
      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseClone);
        })
        .catch(() => {});

      return response;
    })
    .catch(() => {
      // Network failed, try cache first
      return caches.match(request)
        .then((cached) => {
          if (cached) {
            console.log(`✅ Serving cached: ${request.url}`);
            return cached;
          }

          // Not cached, serve index.html for SPA
          return caches.match('/index.html')
            .then((indexHtml) => indexHtml || new Response('Offline', { status: 503 }))
            .catch(() => new Response('Offline', { status: 503 }));
        });
    });
}

/**
 * Check if request is for a static asset
 */
function isAssetRequest(pathname) {
  return CACHE_ASSET_TYPES.some((ext) => pathname.endsWith(ext));
}

/**
 * Create offline response
 */
function createOfflineResponse(request) {
  // Return a basic offline response
  if (request.headers.get('accept').includes('text/html')) {
    return caches.match('/index.html')
      .then((response) => {
        return response || new Response(
          '<html><body><h1>Offline</h1><p>RankIt ZM is working in offline mode.</p></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
  }

  // For non-HTML requests, return a basic response
  return new Response('Service Unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
  });
}

/**
 * MESSAGE EVENT
 * Handle messages from clients (main app)
 * Used for offline logger integration and sync coordination
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  console.log(`📨 Service Worker received message: ${type}`, payload);

  switch (type) {
    case 'SKIP_WAITING':
      // Allows update of service worker
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      // Clear specific cache or all caches
      clearCacheHandler(payload)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((err) => {
          event.ports[0].postMessage({ success: false, error: err.message });
        });
      break;

    case 'GET_CACHE_SIZE':
      // Get total cache size (for monitoring)
      getCacheSizeHandler()
        .then((size) => {
          event.ports[0].postMessage({ success: true, size });
        })
        .catch((err) => {
          event.ports[0].postMessage({ success: false, error: err.message });
        });
      break;

    case 'OFFLINE_LOGGER_EVENT':
      // Log offline events for debugging
      console.log(`💾 Offline Logger Event: ${payload.type}`, payload);
      // Could be used to trigger background sync or other actions
      break;

    case 'TRIGGER_SYNC':
      // Trigger background sync for pending changes
      triggerSyncHandler(payload)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((err) => {
          event.ports[0].postMessage({ success: false, error: err.message });
        });
      break;

    default:
      console.warn(`⚠️ Unknown message type: ${type}`);
  }
});

/**
 * Clear cache handler
 */
async function clearCacheHandler(payload) {
  const { cacheName } = payload;

  if (cacheName) {
    await caches.delete(cacheName);
    console.log(`🧹 Cleared cache: ${cacheName}`);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('🧹 Cleared all caches');
  }
}

/**
 * Get total cache size
 */
async function getCacheSizeHandler() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

/**
 * Trigger background sync
 * (Requires Background Sync API support)
 */
async function triggerSyncHandler(payload) {
  const { tag } = payload;

  try {
    if ('serviceWorker' in navigator && 'SyncManager' in self) {
      // This would be registered in the client
      console.log(`📡 Background sync triggered: ${tag}`);
      // Actual sync logic would be handled by background sync event
    }
  } catch (err) {
    console.warn('⚠️ Background Sync API unavailable:', err);
  }
}

/**
 * BACKGROUND SYNC EVENT
 * Handle background sync for offline data (requires Background Sync API)
 * This is called when the device regains connectivity
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-changes') {
    console.log('📡 Background Sync: Syncing pending changes...');

    event.waitUntil(
      // Notify all clients that sync is starting
      self.clients.matchAll()
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'BACKGROUND_SYNC_START',
              payload: { timestamp: Date.now() },
            });
          });
        })
        .then(() => {
          // Actual sync logic would be in the client
          console.log('✅ Background sync coordination message sent to clients');
        })
        .catch((err) => {
          console.error('❌ Background sync failed:', err);
        })
    );
  }
});

/**
 * PERIODIC SYNC EVENT (optional)
 * For periodic tasks like fetching updates
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    console.log('🔄 Periodic sync: Checking for updates...');

    event.waitUntil(
      fetch('/api/version')
        .then((response) => response.json())
        .then((data) => {
          console.log('✅ Version check complete:', data);
        })
        .catch((err) => {
          console.warn('⚠️ Version check failed:', err);
        })
    );
  }
});

console.log('✅ RankIt ZM Service Worker (v1.2.0) loaded successfully');