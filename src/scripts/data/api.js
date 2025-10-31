import { Idb } from './idb';

const BASE_URL = 'https://story-api.dicoding.dev/v1';
const OUTBOX_STORE = 'outbox';

function normalizeStories(list) {
  const arr = Array.isArray(list) ? list : [];
  const dedup = Object.values(
    arr.reduce((acc, s) => {
      if (s && s.id) acc[s.id] = s;
      return acc;
    }, {})
  );
  dedup.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return dedup;
}

async function handleResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch { /* response tanpa body JSON */ }

  if (!response.ok) {
    const msg = (data && data.message) || response.statusText || 'Request failed';
    console.error('[API Error]', msg, { status: response.status });
    throw new Error(msg);
  }
  return data ?? {};
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function saveToOutbox(record) { await Idb.put(OUTBOX_STORE, record); }
async function getAllOutbox()      { return Idb.getAll(OUTBOX_STORE); }
async function deleteOutbox(id)    { return Idb.del(OUTBOX_STORE, id); }

export async function login({ email, password }) {
  const res = await fetchWithTimeout(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function register({ name, email, password }) {
  const res = await fetchWithTimeout(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function getAllStories({
  token, page = 1, size = 20, location = 0,
} = {}) {
  const url = `${BASE_URL}/stories?page=${page}&size=${size}&location=${location}`;
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse(res);
  return { ...data, listStory: normalizeStories(data.listStory) };
}

export async function getMapStories({ token, page = 1, size = 50 } = {}) {
  const url = `${BASE_URL}/stories?page=${page}&size=${size}&location=1`;
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse(res);
  return { ...data, listStory: normalizeStories(data.listStory) };
}

export async function getStoryById({ token, id }) {
  const res = await fetchWithTimeout(`${BASE_URL}/stories/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function addStory({ token, description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat != null) formData.append('lat', lat);
  if (lon != null) formData.append('lon', lon);

  if (!navigator.onLine) {
    await saveToOutbox({ description, blob: photo, lat, lon, token, createdAt: Date.now() });
    return { queued: true };
  }

  try {
    const res = await fetchWithTimeout(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await handleResponse(res);
    return { ok: true, data };
  } catch (e) {
    await saveToOutbox({ description, blob: photo, lat, lon, token, createdAt: Date.now() });
    return { queued: true };
  }
}

export async function flushOutboxIfAny() {
  if (!navigator.onLine) return;
  const items = await getAllOutbox();
  if (!items.length) return;

  for (const item of items) {
    try {
      const form = new FormData();
      form.append('description', item.description);
      form.append('photo', item.blob);
      if (item.lat != null) form.append('lat', item.lat);
      if (item.lon != null) form.append('lon', item.lon);

      const res = await fetchWithTimeout(`${BASE_URL}/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${item.token}` },
        body: form,
      });

      if (res.ok) {
        await deleteOutbox(item.id);
        window.dispatchEvent(new CustomEvent('stories:uploaded'));
      } else {
        if (res.status === 401) throw new Error('Token kadaluarsa/tidak valid');
      }
    } catch (err) {
      console.warn('[Outbox] gagal unggah satu item:', err);
    }
  }
}

export async function subscribePush({ token, subscription }) {
  const res = await fetchWithTimeout(`${BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    }),
  });
  return handleResponse(res);
}

export async function unsubscribePush({ token, endpoint }) {
  const res = await fetchWithTimeout(`${BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint }),
  });
  return handleResponse(res);
}
