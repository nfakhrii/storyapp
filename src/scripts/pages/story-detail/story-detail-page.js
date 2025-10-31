import StoryModel from '../../data/story-model';
import StoryDetailView from './story-detail-view';
import StoryDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';

export default class StoryDetailPage {
  constructor() {
    const container = document.querySelector('#main-content');
    this.view = new StoryDetailView({ container });
    this.model = new StoryModel();
    this.presenter = new StoryDetailPresenter({ view: this.view, model: this.model });
  }

  async render() { 
    return this.view.getTemplate(); 
  }

  async afterRender() {
    const { id } = parseActivePathname();
    if (!id) {
      this.view.showError('ID story tidak ditemukan pada URL.');
      return;
    }
    await this.presenter.init(id);
  }
}