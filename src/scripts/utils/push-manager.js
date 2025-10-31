import * as Api from '../data/api.js';
import AuthModel from '../data/auth-model.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) & 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function swReady() {
  return navigator.serviceWorker.ready;
}

export async function getExistingSubscription() {
  const reg = await swReady();
  return reg.pushManager.getSubscription();
}

export async function isSubscribed() {
  return !!(await getExistingSubscription());
}

export async function subscribePush() {
  if (!('Notification' in window)) throw new Error('Browser tidak mendukung Notification.');
  const token = AuthModel.getToken();
  if(!token) throw new Error('Anda harus login untuk berlangganan notifikasi.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Izin notifikasi ditolak.');

  const reg = await swReady();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const payload = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')))),
      auth: btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')))),
    },
  };

  await Api.subscribePush({
    token,
    subscription: payload,
  });
  return sub;
}

export async function unsubscribePush() {
  const token = AuthModel.getToken();
  if (!token) throw new Error('Anda harus login.');

  const sub = await getExistingSubscription();
  if (!sub) return;

  await Api.unsubscribePush({
    token,
    endpoint: sub.endpoint,
  });
  await sub.unsubscribe();
}
