import SavedView from './saved-view';
import SavedPresenter from './saved-presenter';

export default class SavedPage {
  constructor() {
    const container = document.querySelector('#main-content');
    this.view = new SavedView({ container });
    this.presenter = new SavedPresenter({ view: this.view });
  }

  async render() { return this.view.getTemplate(); }
  async afterRender() { await this.presenter.init(); }
  destroy() {}
}
