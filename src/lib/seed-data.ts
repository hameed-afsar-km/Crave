import { menuItems } from '@/lib/data';

const sampleOrders = [
  { id: 'CRV-048', outletId: 'lic', outletName: 'Crave LIC Metro', customer: 'Rahul Kumar', phone: '+91 98765 43210', items: [{ name: 'Chicken Shawarma', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 480, pickupTime: '18:30', status: 'preparing' as const, notes: 'Extra garlic sauce please', createdAt: '2026-06-30T17:12:00' },
  { id: 'CRV-047', outletId: 'lic', outletName: 'Crave LIC Metro', customer: 'Priya Sharma', phone: '+91 87654 32109', items: [{ name: 'Beef Burger', qty: 1 }, { name: 'Lemon Mint', qty: 1 }], amount: 330, pickupTime: '18:15', status: 'ready' as const, createdAt: '2026-06-30T17:05:00' },
  { id: 'CRV-046', outletId: 'lic', outletName: 'Crave LIC Metro', customer: 'Amit Patel', phone: '+91 76543 21098', items: [{ name: 'Chicken Combo', qty: 1 }, { name: 'Brownie Sundae', qty: 1 }], amount: 550, pickupTime: '18:00', status: 'completed' as const, createdAt: '2026-06-30T16:50:00' },
  { id: 'CRV-045', outletId: 'lic', outletName: 'Crave LIC Metro', customer: 'Divya Rajan', phone: '+91 65432 10987', items: [{ name: 'Chicken Shawarma', qty: 1 }], amount: 180, pickupTime: '18:45', status: 'received' as const, createdAt: '2026-06-30T17:30:00' },
  { id: 'CRV-044', outletId: 'lic', outletName: 'Crave LIC Metro', customer: 'Vikram Singh', phone: '+91 54321 09876', items: [{ name: 'Veg Shawarma', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 420, pickupTime: '19:00', status: 'received' as const, createdAt: '2026-06-30T17:35:00' },
  { id: 'CRV-043', outletId: 'lic', outletName: 'Crave LIC Metro', customer: 'Ananya Patel', phone: '+91 43210 98765', items: [{ name: 'Chicken Burger', qty: 2 }], amount: 400, pickupTime: '19:15', status: 'preparing' as const, notes: 'No onions', createdAt: '2026-06-30T17:40:00' },
  { id: 'CRV-042', outletId: 'anna', outletName: 'Crave Anna Nagar', customer: 'Sneha Kapoor', phone: '+91 32109 87654', items: [{ name: 'Chocolate Milkshake', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 400, pickupTime: '18:20', status: 'preparing' as const, createdAt: '2026-06-30T17:10:00' },
  { id: 'CRV-041', outletId: 'anna', outletName: 'Crave Anna Nagar', customer: 'Arun Kumar', phone: '+91 21098 76543', items: [{ name: 'Chicken Shawarma', qty: 1 }, { name: 'Lemon Mint', qty: 1 }], amount: 275, pickupTime: '18:50', status: 'received' as const, createdAt: '2026-06-30T17:32:00' },
  { id: 'CRV-040', outletId: 'anna', outletName: 'Crave Anna Nagar', customer: 'Neha Gupta', phone: '+91 10987 65432', items: [{ name: 'Grilled Sandwich', qty: 1 }, { name: 'Mango Shake', qty: 1 }], amount: 290, pickupTime: '17:45', status: 'completed' as const, createdAt: '2026-06-30T16:35:00' },
  { id: 'CRV-039', outletId: 'anna', outletName: 'Crave Anna Nagar', customer: 'Rohan Mehta', phone: '+91 99887 76655', items: [{ name: 'Chicken Nuggets', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 440, pickupTime: '17:30', status: 'ready' as const, createdAt: '2026-06-30T16:20:00' },
];

let memoryOrders: any[] = [];
let memoryMenuItems: any[] = [];
let memorySeeded = false;

export function seedSampleData() {
  memoryMenuItems = [...menuItems];
  memoryOrders = [...sampleOrders];
  memorySeeded = true;
}

export function isSeeded(): boolean {
  return memorySeeded;
}

export function getStoredMenuItems() {
  return memoryMenuItems.length > 0 ? memoryMenuItems : null;
}

export function getStoredOrders() {
  return memoryOrders.length > 0 ? memoryOrders : null;
}

export function saveOrders(orders: any[]) {
  memoryOrders = orders;
}

export function saveMenuItems(items: any[]) {
  memoryMenuItems = items;
}
