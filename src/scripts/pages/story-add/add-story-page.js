import AddStoryView from './add-story-view';
import AddStoryPresenter from './add-story-presenter';

class AddStoryPage {
  constructor() {
    this.view = null;
    this.presenter = null;
  }

  async render() {
    return `
      <section class="container" id="add-story-page">
        <h1 tabindex="0">Tambah Story</h1>
        <div id="form-container"></div>
      </section>
    `;
  }

  async afterRender() {
    const container = document.querySelector('#form-container');

    this.view = new AddStoryView({ container });

    this.presenter = new AddStoryPresenter({ view: this.view });

    this.view.render();

    this.view.bindOnSubmit((payload) => {
      this.presenter.handleSubmit(payload);
    });
  }

  destroy() {
    if (this.view && typeof this.view.destroy === 'function') {
      this.view.destroy();
    }
    this.view = null;
    this.presenter = null;
  }
}

export default AddStoryPage;
