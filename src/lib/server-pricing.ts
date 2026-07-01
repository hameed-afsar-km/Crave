import { getAdminDb } from '@/lib/firebase-admin';
import { menuItems as staticMenuItems } from '@/lib/data';

interface CartItemRequest {
  menuItemId: string;
  quantity: number;
}

interface VerifiedItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
}

interface PricingResult {
  items: VerifiedItem[];
  subtotal: number;
  tax: number;
  total: number;
  errors: string[];
}

const TAX_RATE = 0.18;

async function fetchMenuItems(): Promise<Record<string, any>> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection('menu-items').get();
      const items: Record<string, any> = {};
      snapshot.forEach((doc) => {
        items[doc.id] = { id: doc.id, ...doc.data() };
      });
      if (Object.keys(items).length > 0) return items;
    } catch {
      // fall through to static data
    }
  }
  // Fallback: static menu data
  const items: Record<string, any> = {};
  for (const item of staticMenuItems) {
    items[item.id] = item;
  }
  return items;
}

export async function calculateOrderTotal(
  cartItems: CartItemRequest[],
  outletId: string
): Promise<PricingResult> {
  const errors: string[] = [];
  const verified: VerifiedItem[] = [];
  const menuItemMap = await fetchMenuItems();

  for (const cartItem of cartItems) {
    const menuItem = menuItemMap[cartItem.menuItemId];

    if (!menuItem) {
      errors.push(`Item ${cartItem.menuItemId} not found`);
      continue;
    }

    if (menuItem.available === false) {
      errors.push(`${menuItem.name} is currently unavailable`);
      continue;
    }

    if (menuItem.availableOutlets && !menuItem.availableOutlets.includes(outletId)) {
      errors.push(`${menuItem.name} is not available at this outlet`);
      continue;
    }

    const quantity = Math.max(1, Math.floor(cartItem.quantity));
    const price = menuItem.pricing?.[outletId] ?? menuItem.price ?? 0;

    if (price <= 0) {
      errors.push(`Invalid price for ${menuItem.name}`);
      continue;
    }

    verified.push({
      menuItemId: cartItem.menuItemId,
      name: menuItem.name,
      price,
      quantity,
      available: true,
    });
  }

  const subtotal = Math.round(verified.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return { items: verified, subtotal, tax, total, errors };
}
