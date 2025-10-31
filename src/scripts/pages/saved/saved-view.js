export default class SavedView {
  constructor({ container }) { this.container = container; }

  getTemplate() {
    return `
      <section class="container" id="saved-page">
        <h1 tabindex="0">Offline Saves</h1>

        <div class="toolbar">
          <input 
            id="saved-search" 
            placeholder="Cari story..." 
            aria-label="Cari story offline" 
          />
          <select id="saved-sort" aria-label="Urutkan story">
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama (A–Z)</option>
          </select>
          <select id="saved-filter" aria-label="Filter berdasarkan lokasi">
            <option value="all">Semua Story</option>
            <option value="withLoc">Dengan lokasi</option>
            <option value="noLoc">Tanpa lokasi</option>
          </select>
        </div>

        <div id="saved-list" class="stories-grid" aria-live="polite"></div>
      </section>
    `;
  }

  renderList(items) {
    const list = document.getElementById('saved-list');
    if (!items?.length) {
      list.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <p>Belum ada story yang disimpan offline.</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = items.map(s => `
      <article class="story-card">
        <img src="${s.photoUrl}" alt="Foto story ${s.name}" loading="lazy"/>
        <div class="story-content">
          <h2>${s.name}</h2>
          <p>${s.description}</p>
          <small>${new Date(s.createdAt).toLocaleString('id-ID')}</small>
        </div>
        <div class="actions">
          <a class="btn btn-secondary" href="#/stories/${s.id}">Lihat Detail</a>
          <button class="btn btn-danger" data-del="${s.id}" aria-label="Hapus story ${s.name}">
            Hapus
          </button>
        </div>
      </article>
    `).join('');
  }

  onSearch(cb){ 
    document.getElementById('saved-search')?.addEventListener('input', e => cb(e.target.value)); 
  }
  
  onSort(cb){ 
    document.getElementById('saved-sort')?.addEventListener('change', e => cb(e.target.value)); 
  }
  
  onFilter(cb){ 
    document.getElementById('saved-filter')?.addEventListener('change', e => cb(e.target.value)); 
  }
  
  onDelete(cb){
    document.getElementById('saved-list')?.addEventListener('click', (e) => {
      const id = e.target?.dataset?.del;
      if (id) cb(id);
    });
  }
}