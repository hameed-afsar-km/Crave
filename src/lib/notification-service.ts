const REGISTRATION_KEY = 'crave-sw-registered';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

export async function showBrowserNotification(title: string, options?: Record<string, unknown>) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      vibrate: [200, 100, 200],
      ...options,
    } as any);
  } catch {
    new Notification(title, options);
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    localStorage.setItem(REGISTRATION_KEY, 'true');
    return registration;
  } catch {
    return null;
  }
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!registration.pushManager) return null;
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    await saveSubscription(subscription);
    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscription(subscription);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('crave-token='))?.split('=')[1] || '';
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getTokenFromCookie()}` },
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch {
    // silently fail
  }
}

async function removeSubscription(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push-subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getTokenFromCookie()}` },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } catch {
    // silently fail
  }
}

export function isDocumentHidden(): boolean {
  return document.hidden || document.visibilityState === 'hidden';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
