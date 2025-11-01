import '../styles/styles.css';
import './install.js';
import App from './pages/app';
import { isSubscribed, subscribePush, unsubscribePush } from './utils/push-manager';
import AuthModel from './data/auth-model';
import { flushOutboxIfAny } from './data/api.js';

if (!location.hash) location.replace('#/');

document.addEventListener('DOMContentLoaded', () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  let lastRoute = null;
  let rafId = null;

  const safeRender = (force = false) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(async () => {
      const route = location.hash || '#/';
      if (!force && route === lastRoute) return;
      lastRoute = route;
      await app.renderPage();
    });
  };

  safeRender();
  window.addEventListener('hashchange', () => safeRender());

  if (navigator.onLine) {
    flushOutboxIfAny().catch((err) => console.error('Flush on load failed:', err));
  }
  window.addEventListener('online', async () => {
    try { await flushOutboxIfAny(); }
    catch (err) { console.error('Gagal flush outbox saat online:', err); }
    navigator.serviceWorker?.controller?.postMessage?.({ type: 'FLUSH_OUTBOX' });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (evt) => {
      const { type, url } = evt.data || {};
      if (type === 'NAVIGATE' && url) {
        location.href = url;
      } else if (type === 'REFRESH_HOME') {
        safeRender(true);
      }
    });
  }

  initPushToggle();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = location.pathname.endsWith('/')
      ? location.pathname
      : location.pathname.replace(/[^/]+$/, '');

    navigator.serviceWorker
      .register(`${basePath}sw.bundle.js`, { scope: basePath })
      .catch((err) => console.error('[SW] register failed:', err));
  });
}

async function initPushToggle() {
  const btn = document.getElementById('push-toggle-btn');
  if (!btn) return;

  const updateState = async () => {
    const loggedIn = !!AuthModel.getToken();
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    const online = navigator.onLine;

    btn.disabled = !loggedIn || !supported || !online;
    btn.setAttribute('aria-disabled', String(btn.disabled));

    if (btn.disabled) {
      btn.textContent = !supported
        ? 'Not supported'
        : (!online ? 'Enable Notifications (butuh koneksi)' : 'Enable Notifications (login dulu)');
      return;
    }
    btn.textContent = (await isSubscribed()) ? 'Disable Notifications' : 'Enable Notifications';
  };

  await updateState();

  btn.addEventListener('click', async () => {
    try {
      if (!navigator.onLine) {
        alert('Butuh koneksi internet untuk mengubah status notifikasi.');
        return;
      }
      btn.disabled = true;
      if (await isSubscribed()) {
        btn.textContent = 'Unsubscribing...';
        await unsubscribePush();
      } else {
        btn.textContent = 'Subscribing...';
        await subscribePush();
      }
    } catch (e) {
      alert(e.message || 'Gagal mengubah status notifikasi');
      console.error(e);
    } finally {
      btn.disabled = false;
      await updateState();
    }
  });

  window.addEventListener('hashchange', updateState);
  window.addEventListener('online', updateState);
  window.addEventListener('offline', updateState);
}
