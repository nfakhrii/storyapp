import StoryModel from '../../data/story-model';
import AuthModel from '../../data/auth-model';

export default class HomePresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model || new StoryModel();
    this._isLoading = false;
  }

  async init() {
    if (this._isLoading) return;
    this._isLoading = true;

    try {
      const token = AuthModel.getToken();
      if (!token) {
        this.view.showError('Silakan login dulu untuk melihat stories');
        window.location.hash = '/login';
        return;
      }

      const stories = await this.model.getStories({ location: 1 }); 
      this.view.showStories(stories);
    } catch (error) {
      console.error('[HomePresenter] error:', error);
      this.view.showError(error.message);
    } finally {
      this._isLoading = false;
    }
  }
}
