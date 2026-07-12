import type { Outlet } from '@/types';
import { getOutletTodayHours } from './utils';

export const DEFAULT_OUTLETS: Outlet[] = [
  {
    id: 'lic',
    name: 'Crave LIC Metro',
    address: 'LIC Metro, Chennai',
    phone: '+91 98765 43210',
    email: 'lic@crave.in',
    openingHours: '10:00',
    closingHours: '22:00',
    preparationTime: 10,
    maxOrdersPerSlot: 10,
    pickupWindow: 15,
    isOpen: true,
    status: 'active',
    latitude: 13.0827,
    longitude: 80.2707,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'anna',
    name: 'Crave Anna Nagar',
    address: 'Anna Nagar, Chennai',
    phone: '+91 98765 43211',
    email: 'anna@crave.in',
    openingHours: '10:00',
    closingHours: '22:00',
    preparationTime: 12,
    maxOrdersPerSlot: 8,
    pickupWindow: 20,
    isOpen: true,
    status: 'active',
    latitude: 13.0850,
    longitude: 80.2101,
    createdAt: new Date().toISOString(),
  },
];

const SETTING_KEY = 'crave-selected-outlet';

let cachedOutlets: Outlet[] = [];

export function setCachedOutlets(outlets: Outlet[]) {
  cachedOutlets = outlets;
}

export function loadOutlets(): Outlet[] {
  if (cachedOutlets.length > 0) return cachedOutlets;
  return DEFAULT_OUTLETS;
}

export function saveOutlets(outlets: Outlet[]) {
  cachedOutlets = outlets;
}

export function getOutlet(outletId: string): Outlet | undefined {
  return loadOutlets().find((o) => o.id === outletId);
}

export function getOpenOutlets(): Outlet[] {
  return loadOutlets().filter((o) => o.isOpen && o.status === 'active');
}

export function getSelectedOutletId(): string {
  try {
    return localStorage.getItem(SETTING_KEY) || '';
  } catch {
    return '';
  }
}

export function setSelectedOutletId(id: string) {
  localStorage.setItem(SETTING_KEY, id);
}

export function getOutletName(outletId: string): string {
  const outlet = getOutlet(outletId);
  return outlet?.name || outletId;
}

export function isOutletOpen(outletId: string): boolean {
  const outlet = getOutlet(outletId);
  if (!outlet) return false;
  if (!outlet.isOpen || outlet.status !== 'active') return false;
  if (outlet.maxOrdersPerSlot <= 0) return false;

  const today = getOutletTodayHours(outlet);
  if (today.closed) return false;

  const [oH, oM] = today.open.split(':').map(Number);
  const [cH, cM] = today.close.split(':').map(Number);
  const openMin = oH * 60 + oM;
  const closeMin = cH * 60 + cM;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (closeMin <= openMin) {
    return nowMin >= openMin || nowMin <= closeMin;
  }
  return nowMin >= openMin && nowMin <= closeMin;
}
