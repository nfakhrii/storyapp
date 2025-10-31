import { Idb } from '../../data/idb';

export default class StoryDetailPresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this._story = null;
    this._storyId = null;
    this._isSavedOffline = false;
  }

  async init(id) {
    try {
      this._storyId = id;
      this.view.showLoading();

      const story = await this.model.getStoryById(id);
      if (!story) {
        this.view.showError('Story tidak ditemukan.');
        return;
      }

      this._story = story;

      this._isSavedOffline = await this._checkIfSavedOffline();
      
      this.view.showStory(story, this._isSavedOffline);

      this._setupEventHandlers();

    } catch (err) {
      console.error('[StoryDetailPresenter] init error:', err);
      this.view.showError(err.message || 'Gagal memuat detail story.');
    }
  }

  async _checkIfSavedOffline() {
    if (!this._storyId) return false;
    try {
      const savedStory = await Idb.get('saved', this._storyId);
      return !!savedStory;
    } catch (error) {
      console.error('Error checking offline status:', error);
      return false;
    }
  }

  _setupEventHandlers() {
    this.view.onSaveOffline(async () => {
      await this._saveToOffline();
    });

    this.view.onRemoveOffline(async () => {
      await this._removeFromOffline();
    });
  }

  async _saveToOffline() {
    if (!this._story) return;

    try {
      const payload = {
        id: this._story.id,
        name: this._story.name,
        description: this._story.description,
        photoUrl: this._story.photoUrl,
        lat: this._story.lat ?? null,
        lon: this._story.lon ?? null,
        createdAt: this._story.createdAt || new Date().toISOString(),
      };
      
      await Idb.put('saved', payload);
      this._isSavedOffline = true;
      this.view.toast('Story berhasil disimpan untuk offline ✅');
      
      this.view.updateOfflineStatus(true);
      
    } catch (error) {
      console.error('Error saving to offline:', error);
      this.view.toast('Gagal menyimpan story offline', 'error');
    }
  }

  async _removeFromOffline() {
    if (!this._storyId) return;

    try {
      await Idb.del('saved', this._storyId);
      this._isSavedOffline = false;
      this.view.toast('Story dihapus dari simpanan offline 🗑️');
      
      this.view.updateOfflineStatus(false);
      
    } catch (error) {
      console.error('Error removing from offline:', error);
      this.view.toast('Gagal menghapus story dari simpanan', 'error');
    }
  }
}