export interface StoreSettings {
  storeName: string;
  storeOpen: boolean;
  acceptingOrders: boolean;
  openingTime: string;
  closingTime: string;
  estimatedWaitTime: number;
  maxOrdersPerSlot: number;
  slotDurationMinutes: number;
  averagePrepTime: number;
  notifyNewOrders: boolean;
  notifyReady: boolean;
  pickupWindowMinutes: number;
}

const STORAGE_KEY = 'crave-store-settings';

const defaults: StoreSettings = {
  storeName: 'Crave Express',
  storeOpen: true,
  acceptingOrders: true,
  openingTime: '10:00',
  closingTime: '22:00',
  estimatedWaitTime: 12,
  maxOrdersPerSlot: 10,
  slotDurationMinutes: 15,
  averagePrepTime: 10,
  notifyNewOrders: true,
  notifyReady: true,
  pickupWindowMinutes: 15,
};

export function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(settings: StoreSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getStoreStatus() {
  const settings = loadSettings();
  return {
    isOpen: settings.storeOpen,
    acceptingOrders: settings.acceptingOrders,
    label: settings.storeOpen ? (settings.acceptingOrders ? 'Open' : 'Paused') : 'Closed',
  };
}

export function getTimeUntilOpen(): string {
  const settings = loadSettings();
  if (settings.storeOpen && settings.acceptingOrders) return '';

  const now = new Date();
  const [openH, openM] = settings.openingTime.split(':').map(Number);
  const [closeH, closeM] = settings.closingTime.split(':').map(Number);

  const openToday = new Date(now);
  openToday.setHours(openH, openM, 0, 0);

  const closeToday = new Date(now);
  closeToday.setHours(closeH, closeM, 0, 0);

  const msInDay = 86400000;

  if (now < openToday) {
    const diff = openToday.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `Opens in ${h}h ${m}m` : `Opens in ${m}m`;
  }

  if (now > closeToday || !settings.storeOpen) {
    const nextOpen = new Date(now);
    nextOpen.setDate(nextOpen.getDate() + 1);
    nextOpen.setHours(openH, openM, 0, 0);
    const diff = nextOpen.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `Opens tomorrow in ${h}h ${m}m` : `Opens tomorrow in ${m}m`;
  }

  return settings.acceptingOrders ? '' : 'Temporarily paused — check back soon';
}
