export default class LoginView {
  constructor({ onSubmit }) {
    this.onSubmit = onSubmit;
  }

  getTemplate() {
    return `
      <section class="auth-page">
        <h2 tabindex="-1">Login</h2>
        <form id="loginForm" class="auth-form">
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
          <button type="submit" id="login-button">Login</button>
        </form>
        <p id="login-result" aria-live="polite"></p>
        <p>Belum punya akun? <a href="#/register">Register</a></p>
      </section>
    `;
  }

  bindEvents() {
    const form = document.querySelector('#loginForm');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    const resultEl = document.querySelector('#login-result');
    const submitBtn = document.querySelector('#login-button');

    document.querySelector('.auth-page h2')?.focus();

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

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

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
        submitBtn.textContent = 'Logging in...';
        await this.onSubmit({ email, password });
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }

  showError(message) {
    const resultEl = document.querySelector('#login-result');
    resultEl.textContent = message;
    resultEl.className = 'error';
  }
}
