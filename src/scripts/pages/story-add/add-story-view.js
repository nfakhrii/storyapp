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

class AddStoryView {
  constructor({ container }) {
    this.container = container;
    this.map = null;
    this.selectedLatLng = null;
    this.stream = null;
    this._marker = null;
  }

  render() {
    this.container.innerHTML = `
      <form id="add-story-form" class="story-form">
        <!-- Deskripsi -->
        <div>
          <label for="description">Deskripsi Story</label>
          <textarea 
            id="description" 
            name="description" 
            placeholder="Ceritakan pengalaman Anda..."
            required
            aria-describedby="desc-help desc-counter"
            maxlength="500"
          ></textarea>
          <div class="form-help-container">
            <small id="desc-help" class="form-help">Minimal 10 karakter</small>
            <small id="desc-counter" class="char-counter">0/500</small>
          </div>
        </div>

        <!-- Upload Foto -->
        <div>
          <label for="photo">Foto Story</label>
          <input 
            type="file" 
            id="photo" 
            name="photo" 
            accept="image/*" 
            required 
            aria-describedby="photo-help"
          />
          <small id="photo-help" class="form-help">Maksimal 1MB, format JPG/PNG</small>
        </div>

        <!-- Kamera -->
        <fieldset class="camera-fieldset">
          <legend>Opsi Kamera</legend>
          <button type="button" id="open-camera" aria-describedby="camera-help">
            📸 Ambil Foto dengan Kamera
          </button>
          <small id="camera-help" class="form-help">Alternatif untuk mengambil foto langsung</small>
          
          <video 
            id="camera-stream" 
            autoplay 
            playsinline 
            style="display:none; width:100%; max-height:200px; border-radius:8px; margin-top:10px;"
            aria-label="Preview kamera"
          ></video>
          <canvas id="camera-canvas" style="display:none;" aria-hidden="true"></canvas>
          <button type="button" id="capture-photo" style="display:none;">
            📷 Ambil Foto
          </button>
        </fieldset>

        <!-- Peta -->
        <fieldset class="map-fieldset">
          <legend>📍 Lokasi Story (Opsional)</legend>
          <p class="form-help">Klik pada peta untuk memilih lokasi cerita Anda, atau gunakan lokasi otomatis</p>
          <div 
            id="map" 
            style="height:300px; margin:10px 0; border-radius:8px; overflow:hidden;" 
            role="application"
            aria-label="Peta interaktif untuk memilih lokasi"
            tabindex="0"
          ></div>
          <button type="button" id="use-my-location">📍 Gunakan Lokasi Saya</button>
          <small id="location-status" class="form-help location-status">Belum ada lokasi dipilih</small>
        </fieldset>

        <button type="submit" class="submit-btn">
          ✨ Tambah Story
        </button>
      </form>
      
      <div id="form-message" aria-live="polite" aria-atomic="true"></div>
    `;

    this.initMap();
    this.initCamera();
    this.initCharacterCounter();
  }

  initCharacterCounter() {
    const textarea = this.container.querySelector('#description');
    const counter = this.container.querySelector('#desc-counter');
    const helpText = this.container.querySelector('#desc-help');

    textarea.addEventListener('input', () => {
      const length = textarea.value.length;
      counter.textContent = `${length}/500`;

      if (length < 10) {
        helpText.textContent = `Minimal 10 karakter (${10 - length} lagi)`;
        helpText.style.color = '#c62828';
      } else {
        helpText.textContent = 'Deskripsi sudah sesuai';
        helpText.style.color = '#2e7d32';
      }

      if (length > 450) {
        counter.style.color = '#f57c00';
      } else if (length >= 500) {
        counter.style.color = '#c62828';
      } else {
        counter.style.color = '#666';
      }
    });
  }

  initMap() {
    this.map = L.map('map').setView([-2.5489, 118.0149], 5);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    });

    const hot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, Tiles style by HOT',
    });

    const esri = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri — Source: Esri, Earthstar Geographics' }
    );

    osm.addTo(this.map);

    L.control.layers({
      'OSM Standard': osm,
      'OSM Humanitarian': hot,
      'Esri World Imagery': esri,
    }).addTo(this.map);

    const locationStatus = this.container.querySelector('#location-status');

    this.map.on('click', (e) => {
      this._setMarker(e.latlng, locationStatus);
    });

    const locationBtn = this.container.querySelector('#use-my-location');
    locationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        this.showError('Geolocation tidak didukung di browser Anda');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const latlng = { lat: latitude, lng: longitude };
          this._setMarker(latlng, locationStatus);
          this.map.setView(latlng, 13);
          this.showMessage('Lokasi Anda berhasil digunakan', 'success');
        },
        (err) => {
          this.showError(`Gagal mendapatkan lokasi: ${err.message}`);
        }
      );
    });
  }

  _setMarker(latlng, locationStatus) {
    this.selectedLatLng = latlng;

    if (this._marker) {
      this._marker.setLatLng(latlng);
    } else {
      this._marker = L.marker(latlng, { icon: smallMarkerIcon }).addTo(this.map);
    }

    locationStatus.textContent = `Lokasi dipilih: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    locationStatus.style.color = '#2e7d32';
  }

  initCamera() {
    const openBtn = this.container.querySelector('#open-camera');
    const video = this.container.querySelector('#camera-stream');
    const captureBtn = this.container.querySelector('#capture-photo');
    const canvas = this.container.querySelector('#camera-canvas');
    const fileInput = this.container.querySelector('#photo');

    openBtn.addEventListener('click', async () => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' } 
        });
        
        video.srcObject = this.stream;
        video.style.display = 'block';
        captureBtn.style.display = 'inline-block';
        openBtn.style.display = 'none';
        
        this.showMessage('Kamera berhasil diaktifkan', 'success');
      } catch (err) {
        console.error('Camera error:', err);
        this.showError('Tidak dapat mengakses kamera: ' + err.message);
      }
    });

    captureBtn.addEventListener('click', () => {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-photo.png', { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        this.showMessage('Foto berhasil diambil dari kamera', 'success');
      });

      this.stopCamera();
      video.style.display = 'none';
      captureBtn.style.display = 'none';
      openBtn.style.display = 'inline-block';
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  bindOnSubmit(handler) {
    const form = this.container.querySelector('#add-story-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const description = form.querySelector('#description').value.trim();
      const photoFile = form.querySelector('#photo').files[0];

      if (!description || description.length < 10) {
        this.showError('Deskripsi minimal 10 karakter');
        form.querySelector('#description').focus();
        return;
      }

      if (!photoFile) {
        this.showError('Foto wajib diisi. Pilih foto atau gunakan kamera.');
        form.querySelector('#photo').focus();
        return;
      }

      if (photoFile.size > 1024 * 1024) {
        this.showError('Ukuran foto terlalu besar. Maksimal 1MB.');
        form.querySelector('#photo').focus();
        return;
      }

      if (!photoFile.type.startsWith('image/')) {
        this.showError('File harus berupa gambar (JPG, PNG, dll.)');
        form.querySelector('#photo').focus();
        return;
      }

      const payload = {
        description,
        photo: photoFile,
        lat: this.selectedLatLng ? this.selectedLatLng.lat : undefined,
        lon: this.selectedLatLng ? this.selectedLatLng.lng : undefined,
      };

      handler(payload);
    });
  }

  showError(msg) {
    const box = this.container.querySelector('#form-message');
    box.innerHTML = `<p class="error" role="alert">❌ ${msg}</p>`;
  }

  showSuccess(msg) {
    const box = this.container.querySelector('#form-message');
    box.innerHTML = `<p class="success" role="status">✅ ${msg}</p>`;
  }

  showMessage(msg, type = 'info') {
    const box = this.container.querySelector('#form-message');
    const role = type === 'error' ? 'alert' : 'status';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    box.innerHTML = `<p class="${type}" role="${role}">${icon} ${msg}</p>`;
  }

  destroy() {
    this.stopCamera();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export default AddStoryView;
