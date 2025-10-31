import LoginView from './login-view';
import * as Api from '../../data/api';
import AuthModel from '../../data/auth-model';

export default class LoginPage {
  constructor() {
    this.view = new LoginView({
      onSubmit: this.handleLogin.bind(this),
    });
  }

  async render() {
    return this.view.getTemplate();
  }

  async afterRender() {
    this.view.bindEvents();

    const formElements = document.querySelectorAll('#loginForm input, #loginForm button');
    formElements.forEach((el) => {
      el.addEventListener('focus', () => el.classList.add('focused'));
      el.addEventListener('blur', () => el.classList.remove('focused'));
    });
  }

  async handleLogin({ email, password }) {
    try {
      const result = await Api.login({ email, password });
      if (result.error) {
        this.view.showError(result.message || 'Login gagal');
        return;
      }

      AuthModel.saveToken(result.loginResult.token);

      window.location.hash = '/';
    } catch (err) {
      console.error('[LoginPage] error submit:', err);
      this.view.showError(err.message || 'Terjadi kesalahan saat login');
    }
  }
}
