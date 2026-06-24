import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function generateTimeSlots(): { time: string; label: string }[] {
  const slots = [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = Math.ceil(currentMinutes / 15) * 15;

  for (let i = 0; i < 20; i++) {
    const totalMinutes = startMinutes + i * 15;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
