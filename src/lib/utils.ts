import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Outlet, DayHours } from '@/types';

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const SHORT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getOutletTodayHours(outlet: Outlet): { open: string; close: string; closed: boolean } {
  if (outlet.weeklyHours) {
    const dayKey = DAY_KEYS[new Date().getDay()];
    const dayHours = outlet.weeklyHours[dayKey];
    if (dayHours) return dayHours;
  }
  return { open: outlet.openingHours, close: outlet.closingHours, closed: false };
}

export function formatDayRange(group: { days: string[]; open: string; close: string; closed: boolean }): string {
  if (group.closed) return `${group.days[0]}: Closed`;
  if (group.days.length === 1) return `${group.days[0]}: ${formatTime12(group.open)} – ${formatTime12(group.close)}`;
  if (group.days.length === 2) return `${group.days[0]} – ${group.days[1]}: ${formatTime12(group.open)} – ${formatTime12(group.close)}`;
  return `${group.days[0]} – ${group.days[group.days.length - 1]}: ${formatTime12(group.open)} – ${formatTime12(group.close)}`;
}

export function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function groupWeeklyHours(weeklyHours: Record<string, DayHours>): { days: string[]; open: string; close: string; closed: boolean }[] {
  const groups: { days: string[]; open: string; close: string; closed: boolean }[] = [];
  let current: { days: string[]; open: string; close: string; closed: boolean } | null = null;

  for (const key of DAY_KEYS) {
    const dh = weeklyHours[key] || { open: '10:00', close: '22:00', closed: false };
    if (current && current.open === dh.open && current.close === dh.close && current.closed === dh.closed) {
      current.days.push(SHORT_DAY_LABELS[DAY_KEYS.indexOf(key)]);
    } else {
      current = { days: [SHORT_DAY_LABELS[DAY_KEYS.indexOf(key)]], open: dh.open, close: dh.close, closed: dh.closed };
      groups.push(current);
    }
  }
  return groups;
}

export function defaultWeeklyHours(open = '10:00', close = '22:00'): Record<string, DayHours> {
  const hours: Record<string, DayHours> = {};
  for (const key of DAY_KEYS) {
    hours[key] = { open, close, closed: false };
  }
  return hours;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`;
}

export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function isOutletCurrentlyOpen(hours: { open: string; close: string; closed: boolean }): boolean {
  if (hours.closed) return false;
  const openMin = parseTime(hours.open);
  const closeMin = parseTime(hours.close);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (closeMin <= openMin) {
    return nowMin >= openMin || nowMin <= closeMin;
  }
  return nowMin >= openMin && nowMin <= closeMin;
}

export function getNextOpenDate(hours: { open: string; close: string; closed: boolean }): Date {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = parseTime(hours.open);
  const closeMin = parseTime(hours.close);
  const isOvernight = closeMin <= openMin;

  const today = new Date(now);
  today.setHours(Math.floor(openMin / 60), openMin % 60, 0, 0);

  if (hours.closed) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(Math.floor(openMin / 60), openMin % 60, 0, 0);
    return tomorrow;
  }

  if (isOvernight) {
    if (nowMin >= openMin || nowMin <= closeMin) {
      return today;
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(Math.floor(openMin / 60), openMin % 60, 0, 0);
    return tomorrow;
  }

  if (nowMin < openMin) {
    return today;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(Math.floor(openMin / 60), openMin % 60, 0, 0);
  return tomorrow;
}

export function generateTimeSlots(
  openingTime?: string,
  closingTime?: string,
  preparationTime: number = 0,
): { time: string; label: string }[] {
  const slots: { time: string; label: string }[] = [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const earliestPickup = currentMinutes + preparationTime;
  const startMinutes = Math.ceil(earliestPickup / 15) * 15;

  if (!openingTime || !closingTime) {
    for (let i = 0; i < 40; i++) {
      const totalMinutes = startMinutes + i * 15;
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const label = `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      slots.push({ time, label });
    }
    return slots;
  }

  const openMin = parseTime(openingTime);
  const closeMin = parseTime(closingTime);
  const isOvernight = closeMin <= openMin;
  const effectiveStart = Math.max(startMinutes, openMin);
  const slotStart = Math.ceil(effectiveStart / 15) * 15;
  let wasInWindow = false;

  for (let i = 0; i < 96; i++) {
    const totalMinutes = slotStart + i * 15;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const minsToday = hours * 60 + minutes;
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    let inWindow: boolean;
    if (isOvernight) {
      inWindow = minsToday >= openMin || minsToday <= closeMin;
    } else {
      inWindow = minsToday >= openMin && minsToday <= closeMin;
    }

    if (!inWindow) {
      if (wasInWindow) break;
      continue;
    }

    wasInWindow = true;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const label = `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    slots.push({ time, label });
  }

  return slots;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'received': return 'bg-blue-500';
    case 'preparing': return 'bg-yellow-500';
    case 'ready': return 'bg-green-500';
    case 'completed': return 'bg-gray-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Order Received';
    case 'received': return 'Order Received';
    case 'preparing': return 'Preparing';
    case 'ready': return 'Ready For Pickup';
    case 'completed': return 'Collected';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}
