import StoryModel from '../../data/story-model';
import HomeView from './home-view';
import HomePresenter from './home-presenter';

export default class HomePage {
  constructor() {
    this.model = new StoryModel();
    this.view = new HomeView({ container: document.querySelector('#main-content') });
    this.presenter = new HomePresenter({ view: this.view, model: this.model });
  }

  async render() {
    return this.view.getTemplate();
  }

  async afterRender() {
    await this.presenter.init();
  }

  destroy() {
    if (this.view && typeof this.view.destroy === 'function') {
      this.view.destroy();
    }
  }
}
