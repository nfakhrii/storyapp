import * as API from './api';
import AuthModel from './auth-model';

export default class StoryModel {
  async getStories({ page = 1, size = 50, location = 0 } = {}) {
    const token = AuthModel.getToken();
    if (!token) throw new Error('Missing authentication');

    const response = await API.getAllStories({ token, page, size, location });

    if (response.error) {
      console.error('[StoryModel] getStories error:', response.message);
      throw new Error(response.message || 'Gagal mengambil stories');
    }

    return response.listStory || [];
  }

  async getStoryById(id) {
    const token = AuthModel.getToken();
    if (!token) throw new Error('Missing authentication');

    const response = await API.getStoryById({ token, id });

    if (response.error) {
      console.error('[StoryModel] getStoryById error:', response.message);
      throw new Error(response.message || 'Gagal mengambil detail story');
    }

    return response.story;
  }
}
