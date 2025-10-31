import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const smallMarkerIcon = L.icon({
  iconUrl: 'images/icons/marker-small.png',
  shadowUrl: 'images/icons/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

class HomeView {
  constructor({ container }) {
    this.container = container;
    this._map = null;
    this._markerMap = new Map();
    this._cardClickHandlers = [];
    this._cardKeyHandlers = [];
  }

  getTemplate() {
    return `
      <section class="container" id="home-page">
        <h1 tabindex="0">Beranda - Stories</h1>
        <div id="stories-container" aria-live="polite">
          <p id="loading">Loading stories...</p>
        </div>
        <div 
          id="map" 
          style="height: 400px; margin-top: 20px;" 
          role="region" 
          aria-label="Peta interaktif yang menampilkan lokasi semua stories"
          tabindex="0"
        ></div>
      </section>
    `;
  }

  showStories(stories) {
    const container = document.querySelector('#stories-container');
    container.innerHTML = `
      <div class="stories-grid">
        ${stories.map((s) => `
          <article 
            class="story-card" 
            data-id="${s.id}" 
            tabindex="0" 
            role="article" 
            aria-label="Story by ${s.name}"
          >
            <img src="${s.photoUrl}" alt="Photo of ${s.name}" class="story-photo"/>
            <div class="story-content">
              <h2>${s.name}</h2>
              <p>${s.description}</p>
              <small>${new Date(s.createdAt).toLocaleString()}</small>
              <p style="margin-top:8px;">
                <a class="detail-link" href="#/stories/${s.id}">Lihat detail</a>
              </p>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    this._initMapSafely(stories);
  }

  showError(message) {
    const container = document.querySelector('#stories-container');
    container.innerHTML = `<p class="error" role="alert">${message}</p>`;
  }

  _initMapSafely(stories) {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    this._destroyMapOnly();

    requestAnimationFrame(() => {
      this._map = L.map(mapEl, {
        zoomAnimation: false,
        markerZoomAnimation: false,
        fadeAnimation: true,
      }).setView([-2.5489, 118.0149], 5);

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

      this._markerMap.clear();
      stories.forEach((s) => {
        if (s.lat && s.lon) {
          const m = L.marker([s.lat, s.lon], { icon: smallMarkerIcon })
            .addTo(this._map)
            .bindPopup(`<b>${s.name}</b><br>${s.description}`);
          this._markerMap.set(s.id, m);
          m.on('click', () => this._highlightStory(s.id));
        }
      });

      this._cardClickHandlers = [];
      this._cardKeyHandlers = [];
      document.querySelectorAll('.story-card').forEach((el) => {
        const id = el.getAttribute('data-id');

        const clickHandler = () => {
          const marker = this._markerMap.get(id);
          if (marker && this._map) {
            this._map.setView(marker.getLatLng(), 8, { animate: false });
            marker.openPopup();
            this._highlightStory(id);
          }
        };
        const keyHandler = (e) => {
          if (e.key === 'Enter') {
            const marker = this._markerMap.get(id);
            if (marker && this._map) {
              this._map.setView(marker.getLatLng(), 8, { animate: false });
              marker.openPopup();
              this._highlightStory(id);
            }
            window.location.hash = `#/stories/${id}`;
          }
        };

        el.addEventListener('click', clickHandler);
        el.addEventListener('keydown', keyHandler);
        this._cardClickHandlers.push({ el, h: clickHandler });
        this._cardKeyHandlers.push({ el, h: keyHandler });
      });

      setTimeout(() => this._map && this._map.invalidateSize(), 350);
    });
  }

  _highlightStory(storyId) {
    document.querySelectorAll('.story-card').forEach((el) => el.classList.remove('active'));
    const target = document.querySelector(`.story-card[data-id="${storyId}"]`);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }
  }

  destroy() {
    this._cardClickHandlers.forEach(({ el, h }) => el.removeEventListener('click', h));
    this._cardKeyHandlers.forEach(({ el, h }) => el.removeEventListener('keydown', h));
    this._cardClickHandlers = [];
    this._cardKeyHandlers = [];
    this._destroyMapOnly();
  }

  _destroyMapOnly() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
    this._markerMap.clear();
  }
}

export default HomeView;
