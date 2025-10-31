import AuthModel from '../../data/auth-model';
import * as Api from '../../data/api';
import { Idb } from '../../data/idb';

export default class AddStoryPresenter {
  constructor({ view }) { this.view = view; }

  async handleSubmit({ description, photo, lat, lon }) {
    const token = AuthModel.getToken();
    if (!token) {
      this.view.showError('Anda harus login untuk menambahkan story');
      window.location.hash = '/login';
      return;
    }

    this.view.showMessage('Mengirim story...', 'info');

    try {
      const result = await Api.addStory({ token, description, photo, lat, lon });
      if (!result || result.error) throw new Error(result?.message || 'Gagal menambahkan story');

      this.view.showSuccess('Story berhasil ditambahkan!');
      navigator.serviceWorker?.controller?.postMessage({
        type: 'LOCAL_NOTIFY',
        title: 'Story terkirim',
        body: `Deskripsi: ${description.slice(0, 60)}${description.length > 60 ? '…' : ''}`,
        icon: '/images/icons/icon-192.png',
        badge: '/images/icons/icon-192.png',
        url: '/#/',
        tag: 'story-upload-success',
        renotify: true,
      });

      setTimeout(() => {
        window.location.hash = '/';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }, 900);

    } catch (err) {
      await this._saveToOutbox({ description, photo, lat, lon });
    }
  }

  async _saveToOutbox({ description, photo, lat, lon }) {
    try {
      await Idb.put('outbox', {
        description,
        photo,
        lat: lat ?? null,
        lon: lon ?? null,
        createdAt: new Date().toISOString(),
      });

      this.view.showMessage('Offline: story disimpan & akan di-sync saat online.', 'info');

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if ('SyncManager' in window) {
          try { await reg.sync.register('sync-new-stories'); } catch {}
        } else {
          navigator.serviceWorker.controller?.postMessage({ type: 'FLUSH_OUTBOX' });
          window.addEventListener('online', () =>
            navigator.serviceWorker.controller?.postMessage({ type: 'FLUSH_OUTBOX' }),
            { once: true }
          );
        }
      }
    } catch (e) {
      console.error('[AddStoryPresenter] offline queue error:', e);
      this.view.showError('Gagal menyimpan ke antrian offline. Coba lagi.');
    }
  }
}
