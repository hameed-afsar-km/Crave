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
  runTransaction,
  limit,
  startAfter,
} from 'firebase/firestore';
import { Order, MenuItem, UserProfile, Outlet, Review } from '@/types';
import { logAction, AuditUser } from './audit';
import { StoreSettings, loadSettings, saveSettings as saveLocalSettings } from '@/lib/store';
import { getStoredOrders, getStoredMenuItems } from '@/lib/seed-data';
import { menuItems as defaultMenuItems } from '@/lib/data';
import type { RewardConfig } from '@/lib/store';
import { DEFAULT_OUTLETS, saveOutlets, setCachedOutlets } from '@/lib/outlets';
import { sanitizeUserProfile } from '@/lib/sanitize';

const PROTECTED_ORDER_FIELDS = ['paymentStatus', 'paymentId', 'amount', 'subtotal', 'tax', 'createdAt', 'completedAt'];
const PROTECTED_USER_FIELDS = ['paymentStatus', 'paymentId', 'loyaltyPoints', 'amount', 'subtotal', 'tax', 'createdAt', 'completedAt', 'status', 'assignedOutletId', 'assignedOutletName', 'role', 'uid'];

function stripProtectedFields(data: Record<string, any>, protectedFields: string[]): Record<string, any> {
  const out = { ...data };
  for (const field of protectedFields) {
    delete out[field];
  }
  return out;
}

const COLLECTIONS = {
  ORDERS: 'orders',
  MENU_ITEMS: 'menu-items',
  SETTINGS: 'settings',
  USERS: 'users',
  OUTLETS: 'outlets',
  REVIEWS: 'reviews',
} as const;

function isReady(): boolean {
  return !!db;
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
    addons: data.addons || undefined,
    inclusiveOfGst: data.inclusiveOfGst || false,
    reviewCount: data.reviewCount || 0,
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
    weeklyHours: data.weeklyHours || undefined,
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
    callback(DEFAULT_OUTLETS);
    return () => {};
  }

  const q = query(collection(db!, COLLECTIONS.OUTLETS));
  return onSnapshot(
    q,
    (snapshot) => {
      const outlets = snapshot.docs.map((d) => mapOutletDoc(d));
      setCachedOutlets(outlets);
      saveOutlets(outlets);
      callback(outlets);
    },
    (error) => {
      console.warn('[subscribeOutlets] Listener error:', error);
      callback(DEFAULT_OUTLETS);
    }
  );
}

export async function saveOutletToFirestore(outlet: Outlet): Promise<void> {
  if (isReady()) {
    try {
      const docRef = doc(db!, COLLECTIONS.OUTLETS, outlet.id);
      await setDoc(docRef, { ...outlet, updatedAt: serverTimestamp() }, { merge: true });
      return;
    } catch {
      throw new Error('Failed to save outlet to Firestore');
    }
  }
  throw new Error('Firestore not available');
}

export async function deleteOutletFromFirestore(outletId: string): Promise<void> {
  if (isReady()) {
    try {
      await deleteDoc(doc(db!, COLLECTIONS.OUTLETS, outletId));
      return;
    } catch {
      throw new Error('Failed to delete outlet from Firestore');
    }
  }
  throw new Error('Firestore not available');
}

export async function seedOutlets(): Promise<void> {
  if (!isReady()) throw new Error('Firestore not available');

  for (const outlet of DEFAULT_OUTLETS) {
    try {
      const docRef = doc(db!, COLLECTIONS.OUTLETS, outlet.id);
      await setDoc(docRef, outlet);
    } catch {
      throw new Error('Failed to seed outlets to Firestore');
    }
  }
}

// ─── ORDERS ───

export async function createOrder(order: Record<string, any>): Promise<string> {
  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  const safeOrder = stripProtectedFields(order, PROTECTED_ORDER_FIELDS);

  try {
    if (order.paymentId) {
      const existingQuery = query(
        collection(db!, COLLECTIONS.ORDERS),
        where('paymentId', '==', order.paymentId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        return existingSnapshot.docs[0].id;
      }
    }

    const docRef = await addDoc(collection(db!, COLLECTIONS.ORDERS), {
      ...safeOrder,
      createdAt: serverTimestamp(),
    });
    localStorage.setItem('crave-last-order', JSON.stringify({ id: docRef.id, status: 'received' }));
    return docRef.id;
  } catch {
    throw new Error('Failed to create order. Please try again.');
  }
}

export function subscribeOrders(
  callback: (orders: Order[]) => void,
  constraints: QueryConstraint[] = [],
  outletId?: string,
  maxResults?: number
): () => void {
  if (!isReady()) {
    callback([]);
    return () => {};
  }

  const qConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (outletId) {
    qConstraints.push(where('outletId', '==', outletId));
  }
  if (maxResults) {
    qConstraints.push(limit(maxResults));
  }
  qConstraints.push(...constraints);

  const q = query(collection(db!, COLLECTIONS.ORDERS), ...qConstraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => mapOrderDoc(d)).filter((o) => !o.deleted);
      callback(orders);
    },
    (error) => {
      console.error('[subscribeOrders] ERROR:', String(error));
      console.error('[subscribeOrders] ERROR keys:', Object.getOwnPropertyNames(error));
      callback([]);
    }
  );

  return unsubscribe;
}

export function subscribeOrdersByOutlet(
  callback: (orders: Order[]) => void,
  outletId: string,
): () => void {
  if (!isReady()) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db!, COLLECTIONS.ORDERS),
    where('outletId', '==', outletId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => mapOrderDoc(d)).filter((o) => !o.deleted);
      callback(orders);
    },
    (error) => {
      console.warn('[subscribeOrdersByOutlet] Error:', String(error));
      callback([]);
    }
  );
}

let paginationCursors: Record<string, any> = {};

export function subscribeOrdersPaginated(
  callback: (orders: Order[]) => void,
  pageSize: number = 20,
  outletId?: string,
  statusFilter?: string
): { unsubscribe: () => void; loadMore: () => Promise<boolean> } {
  const key = `${outletId || 'all'}_${statusFilter || 'all'}`;
  paginationCursors[key] = null;

  const buildQuery = () => {
    const qConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
    if (outletId) {
      qConstraints.push(where('outletId', '==', outletId));
    }
    if (statusFilter && statusFilter !== 'all') {
      qConstraints.push(where('status', '==', statusFilter));
    }
    return qConstraints;
  };

  const q = query(collection(db!, COLLECTIONS.ORDERS), ...buildQuery());

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => mapOrderDoc(d)).filter((o) => !o.deleted);
      if (snapshot.docs.length > 0) {
        paginationCursors[key] = snapshot.docs[snapshot.docs.length - 1];
      }
      callback(orders);
    },
    (error) => {
      console.warn('[subscribeOrdersPaginated] Listener error:', error);
      callback([]);
    }
  );

  const loadMore = async (): Promise<boolean> => {
    const cursor = paginationCursors[key];
    if (!cursor) return false;

    try {
      const qConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize)];
      if (outletId) {
        qConstraints.push(where('outletId', '==', outletId));
      }
      if (statusFilter && statusFilter !== 'all') {
        qConstraints.push(where('status', '==', statusFilter));
      }

      const snapshot = await getDocs(query(collection(db!, COLLECTIONS.ORDERS), ...qConstraints));
      const orders = snapshot.docs.map((d) => mapOrderDoc(d)).filter((o) => !o.deleted);

      if (snapshot.docs.length > 0) {
        paginationCursors[key] = snapshot.docs[snapshot.docs.length - 1];
      }
      if (orders.length > 0) {
        callback(orders);
      }
      return snapshot.docs.length >= pageSize;
    } catch {
      return false;
    }
  };

  return { unsubscribe, loadMore };
}

export async function fetchOrdersPage(
  pageSize: number = 20,
  lastDoc?: any,
  outletId?: string,
  statusFilter?: string
): Promise<{ orders: Order[]; lastDoc: any; hasMore: boolean }> {
  if (!isReady()) return { orders: [], lastDoc: null, hasMore: false };

  try {
    const qConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
    if (outletId) {
      qConstraints.push(where('outletId', '==', outletId));
    }
    if (statusFilter && statusFilter !== 'all') {
      qConstraints.push(where('status', '==', statusFilter));
    }
    if (lastDoc) {
      qConstraints.push(startAfter(lastDoc));
    }

    const snapshot = await getDocs(query(collection(db!, COLLECTIONS.ORDERS), ...qConstraints));
    const orders = snapshot.docs.map((d) => mapOrderDoc(d)).filter((o) => !o.deleted);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { orders, lastDoc: newLastDoc, hasMore: snapshot.docs.length >= pageSize };
  } catch {
    return { orders: [], lastDoc: null, hasMore: false };
  }
}

export function subscribeOrder(
  orderId: string,
  callback: (order: Order | null) => void
): () => void {
  if (!isReady()) {
    callback(null);
    return () => {};
  }

  const docRef = doc(db!, COLLECTIONS.ORDERS, orderId);
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(mapOrderDoc(snapshot));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('[subscribeOrder] Listener error:', error);
      callback(null);
    }
  );

  return unsubscribe;
}

export async function fetchCustomerOrdersPage(
  customerId: string,
  pageSize: number = 10,
  lastDoc?: any
): Promise<{ orders: Order[]; lastDoc: any; hasMore: boolean }> {
  if (!isReady() || !customerId) return { orders: [], lastDoc: null, hasMore: false };

  try {
    const qConstraints: QueryConstraint[] = [
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    ];
    if (lastDoc) {
      qConstraints.push(startAfter(lastDoc));
    }

    const snapshot = await getDocs(query(collection(db!, COLLECTIONS.ORDERS), ...qConstraints));
    const orders = snapshot.docs.map((d) => mapOrderDoc(d));
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { orders, lastDoc: newLastDoc, hasMore: snapshot.docs.length >= pageSize };
  } catch {
    return { orders: [], lastDoc: null, hasMore: false };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  extraData?: Record<string, any>,
  loggedBy?: AuditUser
): Promise<void> {
  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = doc(db!, COLLECTIONS.ORDERS, orderId);
    await updateDoc(docRef, { status, ...extraData });
  } catch {
    throw new Error('Failed to update order status. Please try again.');
  }

  logAction(
    status === 'cancelled' ? 'order.cancelled' : 'order.status_changed',
    'order',
    orderId,
    { newStatus: status, ...extraData },
    loggedBy
  );
}

export async function deleteOrder(orderId: string, options?: { deletedBy?: string; deletedReason?: string; cancelledBy?: AuditUser }): Promise<void> {
  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    await updateDoc(doc(db!, COLLECTIONS.ORDERS, orderId), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: options?.deletedBy || null,
      deletedReason: options?.deletedReason || 'Manually deleted',
      status: 'cancelled',
    });

    logAction('order.cancelled', 'order', orderId, { reason: options?.deletedReason || 'Manually deleted', softDelete: true }, options?.cancelledBy);
  } catch {
    throw new Error('Failed to delete order. Please try again.');
  }
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  if (!isReady()) return [];

  try {
    const q = query(
      collection(db!, COLLECTIONS.ORDERS),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapOrderDoc(d));
  } catch {
    return [];
  }
}

export function subscribeCustomerOrders(
  customerId: string,
  callback: (orders: Order[]) => void
): () => void {
  if (!isReady()) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db!, COLLECTIONS.ORDERS),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => mapOrderDoc(d));
      callback(orders);
    },
    (error) => {
      console.warn('[subscribeCustomerOrders] Listener error:', error);
      callback([]);
    }
  );
}

// ─── MENU ITEMS ───

export function subscribeMenuItems(
  callback: (items: MenuItem[]) => void
): () => void {
  if (!isReady()) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db!, COLLECTIONS.MENU_ITEMS),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapMenuItemDoc(d));
      callback(items);
    },
    (error) => {
      console.warn('[subscribeMenuItems] Listener error:', error);
      callback([]);
    }
  );
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = await addDoc(collection(db!, COLLECTIONS.MENU_ITEMS), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch {
    throw new Error('Failed to add menu item. Please try again.');
  }
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>): Promise<void> {
  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = doc(db!, COLLECTIONS.MENU_ITEMS, id);
    await updateDoc(docRef, data);
  } catch {
    throw new Error('Failed to update menu item. Please try again.');
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    await deleteDoc(doc(db!, COLLECTIONS.MENU_ITEMS, id));
  } catch {
    throw new Error('Failed to delete menu item. Please try again.');
  }
}

export async function getMenuItems(): Promise<MenuItem[]> {
  if (!isReady()) return [];

  try {
    const snapshot = await getDocs(collection(db!, COLLECTIONS.MENU_ITEMS));
    return snapshot.docs.map((d) => mapMenuItemDoc(d));
  } catch {
    return [];
  }
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
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const firestoreData = snapshot.data() as Partial<StoreSettings>;
        const merged = { ...loadSettings(), ...firestoreData, storeOpen: firestoreData.storeOpen ?? loadSettings().storeOpen };
        saveLocalSettings(merged as StoreSettings);
        callback(merged as StoreSettings);
      } else {
        callback(loadSettings());
      }
    },
    (error) => {
      console.warn('[subscribeSettings] Listener error:', error);
      callback(loadSettings());
    }
  );
}

export async function saveSettingsToFirestore(settings: StoreSettings): Promise<void> {
  saveLocalSettings(settings);

  if (!isReady()) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = doc(db!, COLLECTIONS.SETTINGS, 'store');
    await setDoc(docRef, settings as any, { merge: true });
  } catch {
    throw new Error('Failed to save settings to server. Please try again.');
  }
}

// ─── USERS ───

export function subscribeUser(
  uid: string,
  callback: (user: UserProfile | null) => void
): () => void {
  if (!isReady() || !uid) {
    callback(null);
    return () => {};
  }

  const docRef = doc(db!, COLLECTIONS.USERS, uid);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as unknown as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('[subscribeUser] Listener error:', error);
      callback(null);
    }
  );
}

export async function saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const sanitized = sanitizeUserProfile(stripProtectedFields(data, PROTECTED_USER_FIELDS));

  if (!isReady() || !uid) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = doc(db!, COLLECTIONS.USERS, uid);
    await setDoc(docRef, { ...sanitized, uid, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error('[saveUserProfile] Firestore write failed:', err);
    throw new Error('Failed to save profile. Please try again.');
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isReady() || !uid) return null;

  try {
    const docRef = doc(db!, COLLECTIONS.USERS, uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as unknown as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── LOYALTY / POINTS ───

export async function updateLoyaltyPoints(
  uid: string,
  points: number
): Promise<void> {
  if (!isReady() || !uid) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = doc(db!, COLLECTIONS.USERS, uid);
    await runTransaction(db!, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      const existing = snapshot.data()?.loyaltyPoints || 0;
      transaction.update(docRef, {
        loyaltyPoints: existing + points,
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    throw new Error('Failed to update loyalty points. Please try again.');
  }
}

export async function redeemReward(
  uid: string,
  reward: RewardConfig
): Promise<{ success: boolean; newPoints: number }> {
  if (!isReady() || !uid) {
    throw new Error('Unable to connect to server. Please check your connection and try again.');
  }

  try {
    const docRef = doc(db!, COLLECTIONS.USERS, uid);
    const result = await runTransaction(db!, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      const currentPoints = snapshot.data()?.loyaltyPoints || 0;
      if (currentPoints < reward.cost) {
        return { success: false, newPoints: currentPoints };
      }
      const newPoints = currentPoints - reward.cost;
      transaction.update(docRef, {
        loyaltyPoints: newPoints,
        updatedAt: serverTimestamp(),
      });
      return { success: true, newPoints };
    });

    return result;
  } catch {
    throw new Error('Failed to redeem reward. Please try again.');
  }
}

export async function getLoyaltyPoints(uid: string): Promise<number> {
  if (!isReady() || !uid) return 0;

  try {
    const docRef = doc(db!, COLLECTIONS.USERS, uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data()?.loyaltyPoints || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

// ─── SYNC UTILITY ───

export async function syncLocalToFirestore(): Promise<{ orders: number; menuItems: number }> {
  if (!isReady()) throw new Error('Firestore not available');

  let ordersSynced = 0;
  let menuItemsSynced = 0;

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

// ─── REVIEWS ───

export function subscribeReviews(
  menuItemId: string,
  callback: (reviews: Review[]) => void,
): () => void {
  if (!isReady()) { callback([]); return () => {}; }

  const q = query(
    collection(db!, COLLECTIONS.REVIEWS),
    where('menuItemId', '==', menuItemId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reviews = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          menuItemId: data.menuItemId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          rating: data.rating || 0,
          comment: data.comment || '',
          createdAt: typeof data.createdAt === 'string' ? data.createdAt : (data.createdAt?.toDate?.()?.toISOString() || ''),
          updatedAt: data.updatedAt,
        } as Review;
      });
      callback(reviews);
    },
    (error) => {
      console.warn('[subscribeReviews] Error:', error);
      callback([]);
    }
  );
}

export async function addReview(
  review: Omit<Review, 'id' | 'createdAt'>,
): Promise<string> {
  if (!isReady()) throw new Error('Unable to connect to server.');

  const docRef = await addDoc(collection(db!, COLLECTIONS.REVIEWS), {
    ...review,
    createdAt: serverTimestamp(),
  });

  // Recalculate aggregate rating for this menu item
  const aggSnap = await getDocs(
    query(collection(db!, COLLECTIONS.REVIEWS), where('menuItemId', '==', review.menuItemId))
  );
  let total = 0;
  let count = 0;
  aggSnap.forEach((d) => {
    total += (d.data().rating || 0);
    count++;
  });
  const avgRating = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

  const menuDocRef = doc(db!, COLLECTIONS.MENU_ITEMS, review.menuItemId);
  const menuDoc = await getDoc(menuDocRef);
  if (menuDoc.exists()) {
    await updateDoc(menuDocRef, { rating: avgRating, reviewCount: count });
  }

  return docRef.id;
}
