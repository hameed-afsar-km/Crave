import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
  QueryConstraint,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { Order, MenuItem, UserProfile, Outlet } from '@/types';
import { StoreSettings, loadSettings, saveSettings as saveLocalSettings } from '@/lib/store';
import { getStoredOrders, saveOrders, getStoredMenuItems, saveMenuItems } from '@/lib/seed-data';
import { menuItems as defaultMenuItems } from '@/lib/data';
import type { RewardConfig } from '@/lib/store';
import { DEFAULT_OUTLETS, loadOutlets, saveOutlets } from '@/lib/outlets';

const COLLECTIONS = {
  ORDERS: 'orders',
  MENU_ITEMS: 'menu-items',
  SETTINGS: 'settings',
  USERS: 'users',
  OUTLETS: 'outlets',
} as const;

function isReady(): boolean {
  return !!db;
}

function generateLocalId(): string {
  return `CRV-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function timestampToDate(ts: Timestamp | null | undefined): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return String(ts);
}

function mapOrderDoc(doc: any): Order {
  const data = doc.data ? doc.data() : doc;
  return {
    id: doc.id,
    outletId: data.outletId || '',
    outletName: data.outletName || '',
    customerId: data.customerId || 'guest',
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerEmail: data.customerEmail || '',
    items: data.items || [],
    amount: data.amount || 0,
    pickupTime: data.pickupTime || '',
    status: data.status || 'received',
    paymentStatus: data.paymentStatus || 'pending',
    paymentId: data.paymentId,
    queuePosition: data.queuePosition,
    estimatedWaitTime: data.estimatedWaitTime ?? 18,
    pointsEarned: data.pointsEarned || 0,
    cancelReason: data.cancelReason || '',
    notes: data.notes || '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : timestampToDate(data.createdAt),
  };
}

function mapMenuItemDoc(doc: any): MenuItem {
  const data = doc.data ? doc.data() : doc;
  return {
    id: doc.id,
    name: data.name || '',
    description: data.description || '',
    price: data.price || 0,
    pricing: data.pricing || undefined,
    image: data.image || '',
    category: data.category || '',
    rating: data.rating || 0,
    available: data.available ?? true,
    availableOutlets: data.availableOutlets || undefined,
    availability: data.availability || undefined,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : timestampToDate(data.createdAt),
  };
}

function mapOutletDoc(doc: any): Outlet {
  const data = doc.data ? doc.data() : doc;
  return {
    id: doc.id,
    name: data.name || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    openingHours: data.openingHours || '10:00',
    closingHours: data.closingHours || '22:00',
    preparationTime: data.preparationTime || 10,
    maxOrdersPerSlot: data.maxOrdersPerSlot || 10,
    pickupWindow: data.pickupWindow || 15,
    isOpen: data.isOpen ?? true,
    status: data.status || 'active',
    latitude: data.latitude,
    longitude: data.longitude,
    bannerImage: data.bannerImage,
    logo: data.logo,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

// ─── OUTLETS ───

export function subscribeOutlets(callback: (outlets: Outlet[]) => void): () => void {
  if (!isReady()) {
    callback(loadOutlets());
    return () => {};
  }

  const q = query(collection(db!, COLLECTIONS.OUTLETS));
  return onSnapshot(q, (snapshot) => {
    const outlets = snapshot.docs.map((d) => mapOutletDoc(d));
    saveOutlets(outlets);
    callback(outlets);
  });
}

export async function saveOutletToFirestore(outlet: Outlet): Promise<void> {
  const local = loadOutlets();
  const idx = local.findIndex((o) => o.id === outlet.id);
  if (idx >= 0) {
    local[idx] = outlet;
  } else {
    local.push(outlet);
  }
  saveOutlets(local);

  if (isReady()) {
    try {
      const docRef = doc(db!, COLLECTIONS.OUTLETS, outlet.id);
      await setDoc(docRef, { ...outlet, updatedAt: serverTimestamp() }, { merge: true });
    } catch {}
  }
}

export async function deleteOutletFromFirestore(outletId: string): Promise<void> {
  const local = loadOutlets().filter((o) => o.id !== outletId);
  saveOutlets(local);

  if (isReady()) {
    try {
      await deleteDoc(doc(db!, COLLECTIONS.OUTLETS, outletId));
    } catch {}
  }
}

export async function seedOutlets(): Promise<void> {
  const local = loadOutlets();
  if (local.length > 0) return;

  saveOutlets(DEFAULT_OUTLETS);

  if (isReady()) {
    for (const outlet of DEFAULT_OUTLETS) {
      try {
        const docRef = doc(db!, COLLECTIONS.OUTLETS, outlet.id);
        await setDoc(docRef, outlet);
      } catch {}
    }
  }
}

// ─── ORDERS ───

export async function createOrder(order: Record<string, any>): Promise<string> {
  const localId = generateLocalId();

  if (isReady()) {
    try {
      const docRef = await addDoc(collection(db!, COLLECTIONS.ORDERS), {
        ...order,
        createdAt: serverTimestamp(),
      });
      const existing = getStoredOrders() || [];
      const savedOrder = { ...order, id: docRef.id, createdAt: new Date().toISOString() };
      existing.unshift(savedOrder);
      saveOrders(existing);
      localStorage.setItem('crave-last-order', JSON.stringify(savedOrder));
      return docRef.id;
    } catch {
      // fall through to localStorage
    }
  }

  const existing = getStoredOrders() || [];
  const savedOrder = { ...order, id: localId, createdAt: new Date().toISOString() };
  existing.unshift(savedOrder);
  saveOrders(existing);
  localStorage.setItem('crave-last-order', JSON.stringify(savedOrder));
  return localId;
}

export function subscribeOrders(
  callback: (orders: Order[]) => void,
  constraints: QueryConstraint[] = []
): () => void {
  if (!isReady()) {
    const orders = getStoredOrders() || [];
    callback(orders.map((o: any) => mapOrderDoc({ ...o, id: o.id })));
    return () => {};
  }

  const q = query(
    collection(db!, COLLECTIONS.ORDERS),
    orderBy('createdAt', 'desc'),
    ...constraints
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => mapOrderDoc(d));
    callback(orders);
  });

  return unsubscribe;
}

export function subscribeOrder(
  orderId: string,
  callback: (order: Order | null) => void
): () => void {
  if (!isReady()) {
    const orders = getStoredOrders() || [];
    const found = orders.find((o: any) => o.id === orderId) || JSON.parse(localStorage.getItem('crave-last-order') || 'null');
    callback(found ? mapOrderDoc({ ...found, id: found.id }) : null);
    return () => {};
  }

  const docRef = doc(db!, COLLECTIONS.ORDERS, orderId);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(mapOrderDoc(snapshot));
    } else {
      callback(null);
    }
  });

  return unsubscribe;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  extraData?: Record<string, any>
): Promise<void> {
  if (isReady()) {
    try {
      const docRef = doc(db!, COLLECTIONS.ORDERS, orderId);
      await updateDoc(docRef, { status, ...extraData });
    } catch {
      // fall through to localStorage
    }
  }

  const orders = getStoredOrders() || [];
  const updated = orders.map((o: any) =>
    o.id === orderId ? { ...o, status, ...extraData } : o
  );
  saveOrders(updated);

  const lastOrder = JSON.parse(localStorage.getItem('crave-last-order') || 'null');
  if (lastOrder && lastOrder.id === orderId) {
    localStorage.setItem('crave-last-order', JSON.stringify({ ...lastOrder, status, ...extraData }));
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  if (isReady()) {
    try {
      await deleteDoc(doc(db!, COLLECTIONS.ORDERS, orderId));
    } catch {
      // fall through
    }
  }

  const orders = getStoredOrders() || [];
  saveOrders(orders.filter((o: any) => o.id !== orderId));
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  if (isReady()) {
    try {
      const q = query(
        collection(db!, COLLECTIONS.ORDERS),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => mapOrderDoc(d));
    } catch {
      // fall through
    }
  }

  const orders = getStoredOrders() || [];
  return orders
    .filter((o: any) => o.customerId === customerId)
    .map((o: any) => mapOrderDoc({ ...o, id: o.id }));
}

export function subscribeCustomerOrders(
  customerId: string,
  callback: (orders: Order[]) => void
): () => void {
  if (!isReady()) {
    const orders = getStoredOrders() || [];
    callback(orders
      .filter((o: any) => o.customerId === customerId)
      .map((o: any) => mapOrderDoc({ ...o, id: o.id }))
    );
    return () => {};
  }

  const q = query(
    collection(db!, COLLECTIONS.ORDERS),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => mapOrderDoc(d));
    callback(orders);
  });
}

// ─── MENU ITEMS ───

export function subscribeMenuItems(
  callback: (items: MenuItem[]) => void
): () => void {
  if (!isReady()) {
    const items = getStoredMenuItems() || [];
    callback(items.map((i: any) => mapMenuItemDoc({ ...i, id: i.id })));
    return () => {};
  }

  const q = query(
    collection(db!, COLLECTIONS.MENU_ITEMS),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => mapMenuItemDoc(d));
    callback(items);
  });
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
  const localId = `item-${Date.now()}`;

  if (isReady()) {
    try {
      const docRef = await addDoc(collection(db!, COLLECTIONS.MENU_ITEMS), {
        ...item,
        createdAt: serverTimestamp(),
      });
      const items = getStoredMenuItems() || [];
      items.push({ ...item, id: docRef.id, createdAt: new Date().toISOString() });
      saveMenuItems(items);
      return docRef.id;
    } catch {
      // fall through
    }
  }

  const items = getStoredMenuItems() || [];
  items.push({ ...item, id: localId, createdAt: new Date().toISOString() });
  saveMenuItems(items);
  return localId;
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>): Promise<void> {
  if (isReady()) {
    try {
      const docRef = doc(db!, COLLECTIONS.MENU_ITEMS, id);
      await updateDoc(docRef, data);
    } catch {
      // fall through
    }
  }

  const items = getStoredMenuItems() || [];
  saveMenuItems(items.map((i: any) => (i.id === id ? { ...i, ...data } : i)));
}

export async function deleteMenuItem(id: string): Promise<void> {
  if (isReady()) {
    try {
      await deleteDoc(doc(db!, COLLECTIONS.MENU_ITEMS, id));
    } catch {
      // fall through
    }
  }

  const items = getStoredMenuItems() || [];
  saveMenuItems(items.filter((i: any) => i.id !== id));
}

export async function getMenuItems(): Promise<MenuItem[]> {
  if (isReady()) {
    try {
      const snapshot = await getDocs(collection(db!, COLLECTIONS.MENU_ITEMS));
      return snapshot.docs.map((d) => mapMenuItemDoc(d));
    } catch {
      // fall through
    }
  }
  const items = getStoredMenuItems() || [];
  return items.map((i: any) => mapMenuItemDoc({ ...i, id: i.id }));
}

// ─── STORE SETTINGS (Global) ───

export function subscribeSettings(
  callback: (settings: StoreSettings) => void
): () => void {
  if (!isReady()) {
    callback(loadSettings());
    return () => {};
  }

  const docRef = doc(db!, COLLECTIONS.SETTINGS, 'store');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const firestoreData = snapshot.data() as Partial<StoreSettings>;
      const merged = { ...loadSettings(), ...firestoreData, storeOpen: firestoreData.storeOpen ?? loadSettings().storeOpen };
      callback(merged as StoreSettings);
    } else {
      callback(loadSettings());
    }
  });
}

export async function saveSettingsToFirestore(settings: StoreSettings): Promise<void> {
  saveLocalSettings(settings);

  if (isReady()) {
    try {
      const docRef = doc(db!, COLLECTIONS.SETTINGS, 'store');
      await setDoc(docRef, settings as any, { merge: true });
    } catch {
      // silently fail
    }
  }
}

// ─── USERS ───

export function subscribeUser(
  uid: string,
  callback: (user: UserProfile | null) => void
): () => void {
  if (!isReady() || !uid) {
    const saved = localStorage.getItem('crave-user');
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }

  const docRef = doc(db!, COLLECTIONS.USERS, uid);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as unknown as UserProfile);
    } else {
      callback(null);
    }
  });
}

export async function saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const existing = localStorage.getItem('crave-user');
  if (existing) {
    const parsed = JSON.parse(existing);
    localStorage.setItem('crave-user', JSON.stringify({ ...parsed, ...data }));
  }

  if (isReady() && uid) {
    try {
      const docRef = doc(db!, COLLECTIONS.USERS, uid);
      await setDoc(docRef, { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
    } catch {
      // silently fail
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isReady() && uid) {
    try {
      const docRef = doc(db!, COLLECTIONS.USERS, uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as unknown as UserProfile;
      }
    } catch {
      // fall through
    }
  }

  const saved = localStorage.getItem('crave-user');
  return saved ? JSON.parse(saved) : null;
}

// ─── LOYALTY / POINTS ───

export async function updateLoyaltyPoints(
  uid: string,
  points: number
): Promise<void> {
  const current = parseInt(localStorage.getItem('crave-points') || '0', 10);
  localStorage.setItem('crave-points', String(current + points));

  if (isReady() && uid) {
    try {
      const docRef = doc(db!, COLLECTIONS.USERS, uid);
      await updateDoc(docRef, {
        loyaltyPoints: (await getDoc(docRef)).data()?.loyaltyPoints || 0 + points,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // silently fail
    }
  }
}

export async function getLoyaltyPoints(uid: string): Promise<number> {
  if (isReady() && uid) {
    try {
      const docRef = doc(db!, COLLECTIONS.USERS, uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data()?.loyaltyPoints || 0;
      }
    } catch {
      // fall through
    }
  }
  return parseInt(localStorage.getItem('crave-points') || '0', 10);
}

// ─── SYNC UTILITY ───

export async function syncLocalToFirestore(): Promise<{ orders: number; menuItems: number }> {
  let ordersSynced = 0;
  let menuItemsSynced = 0;

  if (!isReady()) throw new Error('Firestore not available');

  const localOrders = getStoredOrders() || [];
  for (const order of localOrders) {
    try {
      const { id, ...data } = order;
      const q = query(collection(db!, COLLECTIONS.ORDERS), where('id', '==', id));
      const existing = await getDocs(q);
      if (existing.empty) {
        await addDoc(collection(db!, COLLECTIONS.ORDERS), {
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : serverTimestamp(),
        });
        ordersSynced++;
      }
    } catch {
      // skip failed orders
    }
  }

  const localMenuItems = getStoredMenuItems() || [];
  for (const item of localMenuItems) {
    try {
      const { id, ...data } = item;
      const q = query(collection(db!, COLLECTIONS.MENU_ITEMS), where('name', '==', data.name));
      const existing = await getDocs(q);
      if (existing.empty) {
        await addDoc(collection(db!, COLLECTIONS.MENU_ITEMS), {
          ...data,
          createdAt: serverTimestamp(),
        });
        menuItemsSynced++;
      }
    } catch {
      // skip failed items
    }
  }

  try {
    const settings = loadSettings();
    const settingsRef = doc(db!, COLLECTIONS.SETTINGS, 'store');
    await setDoc(settingsRef, settings as any, { merge: true });
  } catch {
    // skip settings
  }

  localStorage.setItem('crave-migrated', 'true');

  return { orders: ordersSynced, menuItems: menuItemsSynced };
}

export async function isFirestoreEmpty(): Promise<boolean> {
  if (!isReady()) return true;
  try {
    const snapshot = await getDocs(collection(db!, COLLECTIONS.MENU_ITEMS));
    return snapshot.empty;
  } catch {
    return true;
  }
}

export async function seedDefaultMenuItems(): Promise<number> {
  if (!isReady()) return 0;
  let count = 0;
  for (const item of defaultMenuItems) {
    try {
      const { id, ...data } = item;
      const q = query(collection(db!, COLLECTIONS.MENU_ITEMS), where('name', '==', data.name));
      const existing = await getDocs(q);
      if (existing.empty) {
        await addDoc(collection(db!, COLLECTIONS.MENU_ITEMS), {
          ...data,
          createdAt: serverTimestamp(),
        });
        count++;
      }
    } catch {
      // skip
    }
  }
  return count;
}
