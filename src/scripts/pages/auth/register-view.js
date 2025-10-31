export default class RegisterView {
  constructor({ onSubmit }) {
    this.onSubmit = onSubmit;
  }

  getTemplate() {
    return `
      <section class="auth-page">
        <h2 tabindex="-1">Register</h2>
        <form id="registerForm" class="auth-form">
          <div class="form-group">
            <label for="name">Nama Lengkap</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Masukkan nama lengkap Anda" 
              required 
              aria-describedby="error-name"
            />
            <small class="error-message" id="error-name"></small>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Masukkan email Anda" 
              required 
              aria-describedby="error-email"
            />
            <small class="error-message" id="error-email"></small>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Masukkan password Anda" 
              required 
              aria-describedby="error-password"
            />
            <small class="error-message" id="error-password"></small>
          </div>
          <button type="submit" id="register-button">Register</button>
        </form>
        <p id="register-result" aria-live="polite"></p>
        <p>Sudah punya akun? <a href="#/login">Login</a></p>
      </section>
    `;
  }

  bindEvents() {
    const form = document.querySelector('#registerForm');
    const nameInput = document.querySelector('#name');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    const resultEl = document.querySelector('#register-result');
    const submitBtn = document.querySelector('#register-button');

    document.querySelector('.auth-page h2')?.focus();

    nameInput.addEventListener('input', () => {
      const errorEl = document.querySelector('#error-name');
      errorEl.textContent = nameInput.value.length < 3 ? 'Nama minimal 3 karakter' : '';
    });

    emailInput.addEventListener('input', () => {
      const errorEl = document.querySelector('#error-email');
      const regex = /^[^@]+@[^@]+\.[^@]+$/;
      errorEl.textContent = !regex.test(emailInput.value) ? 'Email tidak valid' : '';
    });

    passwordInput.addEventListener('input', () => {
      const errorEl = document.querySelector('#error-password');
      errorEl.textContent = passwordInput.value.length < 8 ? 'Password minimal 8 karakter' : '';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      resultEl.textContent = '';
      resultEl.className = '';

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (name.length < 3) {
        resultEl.textContent = 'Nama minimal 3 karakter';
        resultEl.className = 'error';
        nameInput.focus();
        return;
      }

      if (!email) {
        resultEl.textContent = 'Email wajib diisi';
        resultEl.className = 'error';
        emailInput.focus();
        return;
      }

      if (password.length < 8) {
        resultEl.textContent = 'Password minimal 8 karakter';
        resultEl.className = 'error';
        passwordInput.focus();
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        await this.onSubmit({ name, email, password });
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
      }
    });
  }

  showError(message) {
    const resultEl = document.querySelector('#register-result');
    resultEl.textContent = message;
    resultEl.className = 'error';
  }

  showSuccess(message) {
    const resultEl = document.querySelector('#register-result');
    resultEl.textContent = message;
    resultEl.className = 'success';
  }
}
