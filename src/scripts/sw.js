import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));

precacheAndRoute(self.__WB_MANIFEST);

const STORY_API_ORIGIN = 'https://story-api.dicoding.dev';
const JSON_CACHE = 'story-api-json';

const ICON_192 = new URL('images/icons/icon-192.png', self.registration.scope).toString();
const LOGO_IMG = new URL('images/logo.png', self.registration.scope).toString();
const INDEX_URL = new URL('index.html', self.registration.scope).toString();

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'app-shell' }),
);

setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') {
    return (await caches.match(INDEX_URL)) || Response.error();
  }
  return Response.error();
});

registerRoute(
  ({ url, request }) =>
    url.origin === STORY_API_ORIGIN &&
    request.method === 'GET' &&
    request.destination !== 'image',
  new NetworkFirst({
    cacheName: JSON_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          const u = new URL(request.url); u.search = '';
          return u.toString();
        },
        fetchDidSucceed: async ({ request, response }) => {
          try {
            const url = new URL(request.url);
            if (url.origin === STORY_API_ORIGIN && url.pathname === '/v1/stories') {
              const data = await response.clone().json();
              if (Array.isArray(data?.listStory)) {
                const cache = await caches.open(JSON_CACHE);
                await Promise.all(
                  data.listStory.map(async (s) => {
                    const key = new URL('/v1/stories/' + s.id, STORY_API_ORIGIN).toString();
                    const detailRes = new Response(JSON.stringify({
                      error: false,
                      message: 'Story fetched successfully',
                      story: s,
                    }), { headers: { 'Content-Type': 'application/json' } });
                    await cache.put(key, detailRes);
                  })
                );
              }
            }
          } catch { /* ignore parse errors */ }
          return response;
        },
        handlerDidError: async ({ request }) => {
          const u = new URL(request.url); u.search = '';
          const cache = await caches.open(JSON_CACHE);
          const cached = await cache.match(u.toString());
          if (cached) return cached;
          return Response.error();
        },
      },
    ],
  }),
);

registerRoute(
  ({ url, request }) => url.origin === STORY_API_ORIGIN && request.method !== 'GET',
  new NetworkOnly()
);

registerRoute(
  ({ url, request }) =>
    url.origin === STORY_API_ORIGIN && request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
);

registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin === self.location.origin,
  new StaleWhileRevalidate({ cacheName: 'images-static' }),
);

registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.gstatic.com' ||
    url.origin === 'https://fonts.googleapis.com' ||
    url.hostname.includes('fontawesome') ||
    url.hostname.includes('cdnjs'),
  new CacheFirst({ cacheName: 'fonts-assets' }),
);

registerRoute(
  ({ url, request }) =>
    request.destination === 'image' &&
    (url.hostname.endsWith('tile.openstreetmap.org') ||
     url.hostname.endsWith('openstreetmap.fr') ||
     url.hostname.includes('arcgisonline.com')),
  new CacheFirst({ cacheName: 'map-tiles' }),
);

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'FLUSH_OUTBOX') event.waitUntil(flushOutbox());
  if (data.type === 'LOCAL_NOTIFY') {
    const {
      title,
      body,
      icon = ICON_192,
      badge = ICON_192,
    } = data;
    event.waitUntil(self.registration.showNotification(title || 'Story', {
      body, icon, badge, tag: 'local-info'
    }));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-stories') event.waitUntil(flushOutbox());
});

function openDB_SW() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('story-app-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getAll_SW(store) {
  const db = await openDB_SW();
  return new Promise((res, rej) => {
    const r = db.transaction(store).objectStore(store).getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
}
async function del_SW(store, key) {
  const db = await openDB_SW();
  return new Promise((res, rej) => {
    const r = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    r.onsuccess = () => res(true);
    r.onerror = () => rej(r.error);
  });
}

let __outboxLock = false;

async function flushOutbox() {
  if (__outboxLock) return;
  __outboxLock = true;
  try {
    const items = await getAll_SW('outbox');
    if (!items.length) return;

    for (const item of items) {
      try {
        const fileBlob = item.blob || item.photo;
        const token = item.token;

        if (!fileBlob || !token) {
          continue;
        }

        const fd = new FormData();
        fd.append('description', item.description);
        fd.append('photo', fileBlob, 'offline.jpg');
        if (item.lat != null) fd.append('lat', item.lat);
        if (item.lon != null) fd.append('lon', item.lon);

        const resp = await fetch(`${STORY_API_ORIGIN}/v1/stories`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!resp.ok) throw new Error('upload failed');

        await del_SW('outbox', item.id);

        await self.registration.showNotification('Sinkronisasi Berhasil', {
          body: item.description,
          icon: ICON_192,
          badge: ICON_192,
        });

        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientsList.forEach(c => c.postMessage({ type: 'REFRESH_HOME' }));
      } catch (e) {
        break;
      }
    }
  } finally {
    __outboxLock = false;
  }
}

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { title: event.data?.text ? event.data.text() : 'Story App' }; }

  const title = payload.title || 'Story berhasil dibuat';
  const body =
    payload.options?.body ||
    payload.body ||
    'Story baru berhasil dibuat.';
  const icon = payload.options?.icon || LOGO_IMG;
  const badge = payload.options?.badge;

  const base = self.registration.scope;
  const storyId = payload.storyId || payload.data?.storyId;
  const explicitUrl = payload.data?.url || payload.detailUrl;

  const targetUrl = explicitUrl
    ? new URL(explicitUrl, base).toString()
    : (storyId
        ? new URL(`#/stories/${storyId}`, base).toString()
        : new URL(`#/`, base).toString());

  const options = {
    body, icon, badge,
    vibrate: [100, 50, 100],
    tag: 'story-created', renotify: true,
    data: { url: targetUrl },
    actions: [
      { action: 'open-detail', title: 'Lihat detail' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const base = self.registration.scope;
  const targetUrl = event.notification.data?.url || new URL(`#/`, base).toString();
  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if ('focus' in client) {
        await client.focus();
        if (client.url !== targetUrl && 'navigate' in client) await client.navigate(targetUrl);
        else client.postMessage({ type: 'NAVIGATE', url: targetUrl });
        return;
      }
    }
    if (clients.openWindow) await clients.openWindow(targetUrl);
  })());
});
