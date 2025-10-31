import RegisterView from './register-view';
import { register } from '../../data/api';

export default class RegisterPage {
  constructor() {
    this.view = new RegisterView({
      onSubmit: this.handleRegister.bind(this),
    });
  }

  async render() {
    return this.view.getTemplate();
  }

  async afterRender() {
    this.view.bindEvents();
  }

  async handleRegister({ name, email, password }) {
    try {
      const result = await register({ name, email, password });

      if (result.error) {
        this.view.showError(result.message || 'Register gagal');
        return;
      }

      this.view.showSuccess(result.message || 'Register berhasil');

      setTimeout(() => {
        window.location.hash = '/login';
      }, 1000);
    } catch (err) {
      this.view.showError('Register gagal: ' + err.message);
    }
  }
}
