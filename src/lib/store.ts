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
