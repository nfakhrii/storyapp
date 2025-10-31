import { openDB } from 'idb';

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('saved')) {
      db.createObjectStore('saved', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('outbox')) {
      db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
    }
  },
});

export const Idb = {
  async put(store, value)  { return (await dbPromise).put(store, value); },
  async get(store, key)    { return (await dbPromise).get(store, key); },
  async getAll(store)      { return (await dbPromise).getAll(store); },
  async del(store, key)    { return (await dbPromise).delete(store, key); },
  async clear(store)       { return (await dbPromise).clear(store); },
};
