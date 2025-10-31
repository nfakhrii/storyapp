export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <h1 class="about-title" tabindex="0">Tentang Story App</h1>
        <p class="about-desc">
          Story App adalah aplikasi berbasis web yang memungkinkan Anda untuk
          berbagi cerita berupa foto, deskripsi, dan lokasi di peta digital.
          Aplikasi ini menerapkan arsitektur <strong>Single Page Application (SPA)</strong>
          dengan <strong>MVP (Model-View-Presenter)</strong> pattern.
        </p>
        
        <ul class="about-features">
          <li>🌍 Menampilkan story dengan lokasi di peta interaktif</li>
          <li>🖼️ Tambah story dengan upload foto atau kamera langsung</li>
          <li>🧭 Navigasi mudah tanpa reload halaman (SPA)</li>
          <li>🔑 Autentikasi aman dengan token</li>
        </ul>

        <div class="about-credits">
          <h2 tabindex="0">Credits</h2>
          <p>
            Aplikasi ini dibuat sebagai bagian dari submission kelas
            <em>Belajar Pengembangan Web Intermediate</em> di Dicoding.
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const title = document.querySelector('.about-title');
    const desc = document.querySelector('.about-desc');
    const features = document.querySelectorAll('.about-features li');

    title.style.opacity = 0;
    setTimeout(() => {
      title.style.transition = 'opacity 1s ease';
      title.style.opacity = 1;
    }, 200);

    desc.style.opacity = 0;
    desc.style.transform = 'translateY(20px)';
    setTimeout(() => {
      desc.style.transition = 'all 1s ease';
      desc.style.opacity = 1;
      desc.style.transform = 'translateY(0)';
    }, 600);

    features.forEach((item, index) => {
      item.style.opacity = 0;
      item.style.transform = 'translateX(-20px)';
      setTimeout(() => {
        item.style.transition = 'all 0.6s ease';
        item.style.opacity = 1;
        item.style.transform = 'translateX(0)';
      }, 1000 + index * 200);
    });
  }
}
