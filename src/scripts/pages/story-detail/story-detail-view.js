import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const largeMarkerIcon = L.icon({
  iconUrl: 'images/icons/marker-large.png',
  shadowUrl: 'images/icons/marker-shadow.png',
  iconSize: [40, 60],
  iconAnchor: [20, 60],
  popupAnchor: [1, -52],
  shadowSize: [50, 60],
});

class StoryDetailView {
  constructor({ container }) {
    this.container = container;
    this._map = null;
    this._marker = null;
    this._saveOfflineHandler = null;
    this._removeOfflineHandler = null;
  }

  getTemplate() {
    return `
      <section class="container" id="story-detail-page">
        <h1 tabindex="0">Detail Story</h1>
        <div id="story-detail-container" aria-live="polite">
          <p id="loading">Memuat detail story...</p>
        </div>

        <div id="actions-container" class="actions">
          <!-- Tombol akan di-render secara dinamis -->
        </div>

        <div id="map-detail" style="display: none;"></div>
        <a href="#/" class="back-link">⬅ Kembali ke Beranda</a>
      </section>
    `;
  }

  showLoading() {
    const container = document.querySelector('#story-detail-container');
    if (container) container.innerHTML = `<p id="loading">Memuat detail story...</p>`;
  }

  showStory(story, isSavedOffline = false) {
    const container = document.querySelector('#story-detail-container');
    container.innerHTML = `
      <article class="story-detail-card" role="article" aria-label="Story oleh ${story.name}">
        <img 
          src="${story.photoUrl}" 
          alt="Foto story ${story.name}" 
          class="story-photo-large"
          loading="lazy"
        />
        <div class="story-detail-content">
          <h2>${story.name}</h2>
          <p>${story.description}</p>
          <small>Dibuat: ${new Date(story.createdAt).toLocaleString('id-ID')}</small>
          ${story.lat && story.lon ? 
            `<small style="display: block; margin-top: 0.5rem;">
              📍 Lokasi: ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
            </small>` : 
            ''
          }
        </div>
      </article>
    `;

    this._renderActions(isSavedOffline);

    if (story.lat && story.lon) {
      this._showMap(story);
    }
  }

  _renderActions(isSavedOffline) {
    const actionsContainer = document.querySelector('#actions-container');
    
    actionsContainer.innerHTML = '';
    
    if (isSavedOffline) {
      actionsContainer.innerHTML = `
        <button id="btnRemoveOffline" class="btn btn-danger">
          🗑️ Hapus dari Simpanan
        </button>
        <a href="#/saved" class="btn btn-secondary" style="margin-left: auto;">
          📂 Lihat Semua Simpanan
        </a>
      `;
    } else {
      actionsContainer.innerHTML = `
        <button id="btnSaveOffline" class="btn btn-primary">
          💾 Simpan Offline
        </button>
        <a href="#/saved" class="btn btn-secondary" style="margin-left: auto;">
          📂 Lihat Simpanan
        </a>
      `;
    }
  }

  showError(message) {
    const container = document.querySelector('#story-detail-container');
    if (container) {
      container.innerHTML = `
        <div class="error" role="alert">
          <p>${message}</p>
          <a href="#/" class="back-link" style="display: inline-block; margin-top: 1rem;">
            ⬅ Kembali ke Beranda
          </a>
        </div>
      `;
    }
  }

  onSaveOffline(callback) {
    if (this._saveOfflineHandler) {
      document.removeEventListener('click', this._saveOfflineHandler);
    }
    
    this._saveOfflineHandler = (e) => {
      if (e.target.id === 'btnSaveOffline' || e.target.closest('#btnSaveOffline')) {
        e.preventDefault();
        callback();
      }
    };
    
    document.addEventListener('click', this._saveOfflineHandler);
  }

  onRemoveOffline(callback) {
    if (this._removeOfflineHandler) {
      document.removeEventListener('click', this._removeOfflineHandler);
    }
    
    this._removeOfflineHandler = (e) => {
      if (e.target.id === 'btnRemoveOffline' || e.target.closest('#btnRemoveOffline')) {
        e.preventDefault();
        callback();
      }
    };
    
    document.addEventListener('click', this._removeOfflineHandler);
  }

  updateOfflineStatus(isSavedOffline) {
    this._renderActions(isSavedOffline);
  }

  toast(msg, type = 'success') {
    const existingToasts = document.querySelectorAll('[data-toast]');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    const backgroundColor = type === 'success' ? 'var(--success-color)' : 
                           type === 'error' ? 'var(--error-color)' : 
                           'var(--primary-color)';
    
    toast.setAttribute('data-toast', 'true');
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }

  _showMap(story) {
    const mapEl = document.getElementById('map-detail');
    if (!mapEl) return;

    mapEl.style.display = 'block';
    this._destroyMapOnly();

    requestAnimationFrame(() => {
      if (!mapEl.isConnected) return;

      this._map = L.map(mapEl, {
        zoomAnimation: false,
        markerZoomAnimation: false,
        fadeAnimation: true,
      }).setView([story.lat, story.lon], 13);

      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      });
      const hot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT',
      });
      const esri = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri — Source: Esri, USGS, …' },
      );

      osm.addTo(this._map);
      L.control.layers(
        { 'OSM Standard': osm, 'OSM Humanitarian': hot, 'Esri World Imagery': esri },
      ).addTo(this._map);

      this._marker = L.marker([story.lat, story.lon], { icon: largeMarkerIcon })
        .addTo(this._map)
        .bindPopup(`
          <div style="padding: 0.5rem;">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${story.name}</h3>
            <p style="margin: 0; font-size: 0.9rem;">${story.description}</p>
          </div>
        `)
        .openPopup();

      setTimeout(() => this._map && this._map.invalidateSize(), 350);
    });
  }

  destroy() {
    if (this._saveOfflineHandler) {
      document.removeEventListener('click', this._saveOfflineHandler);
      this._saveOfflineHandler = null;
    }
    if (this._removeOfflineHandler) {
      document.removeEventListener('click', this._removeOfflineHandler);
      this._removeOfflineHandler = null;
    }
    
    this._destroyMapOnly();
  }
  
  _destroyMapOnly() {
    if (this._map) {
      this._map.remove();
      this._map = null;
      this._marker = null;
    }
  }
}

if (!document.querySelector('#toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export default StoryDetailView;