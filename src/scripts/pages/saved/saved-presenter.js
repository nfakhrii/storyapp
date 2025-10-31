import { Idb } from '../../data/idb';

export default class SavedPresenter {
  constructor({ view }) {
    this.view = view;
    this._raw = [];
    this._state = { q: '', sort: 'newest', filter: 'all' };
  }

  async init() {
    this._raw = await Idb.getAll('saved');
    this._render();

    this.view.onSearch((q) => { this._state.q = q; this._render(); });
    this.view.onSort((s) => { this._state.sort = s; this._render(); });
    this.view.onFilter((f) => { this._state.filter = f; this._render(); });
    this.view.onDelete(async (id) => {
      await Idb.del('saved', id);
      this._raw = this._raw.filter(x => x.id !== id);
      this._render();
    });
  }

  _render() {
    let items = [...this._raw];

    if (this._state.filter === 'withLoc') items = items.filter(x => x.lat != null && x.lon != null);
    if (this._state.filter === 'noLoc')   items = items.filter(x => x.lat == null && x.lon == null);

    const q = this._state.q.trim().toLowerCase();
    if (q) items = items.filter(x =>
      (x.name||'').toLowerCase().includes(q) || (x.description||'').toLowerCase().includes(q)
    );

    if (this._state.sort === 'newest') items.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    if (this._state.sort === 'oldest') items.sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
    if (this._state.sort === 'name')   items.sort((a,b)=> (a.name||'').localeCompare(b.name||''));

    this.view.renderList(items);
  }
}
