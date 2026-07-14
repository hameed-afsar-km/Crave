import { getAdminDb } from '@/lib/firebase-admin';

interface CartItemAddon {
  name: string;
  price: number;
}

interface CartItemRequest {
  menuItemId: string;
  quantity: number;
  addons?: CartItemAddon[];
}

interface CouponRequest {
  code: string;
}

interface VerifiedItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
  addons: CartItemAddon[];
  addonTotal: number;
  inclusiveOfGst: boolean;
}

interface PricingResult {
  items: VerifiedItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  couponCode?: string;
  couponError?: string;
  errors: string[];
}

const TAX_RATE = 0.18;

async function fetchMenuItems(): Promise<Record<string, any>> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error('Pricing unavailable: database not connected');
  }

  const snapshot = await adminDb.collection('menu-items').get();
  if (snapshot.empty) {
    throw new Error('Pricing unavailable: no menu items found');
  }

  const items: Record<string, any> = {};
  snapshot.forEach((doc) => {
    items[doc.id] = { id: doc.id, ...doc.data() };
  });
  return items;
}

async function validateCoupon(
  code: string,
  subtotal: number,
  outletId: string
): Promise<{ valid: boolean; discount: number; error?: string }> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { valid: false, discount: 0, error: 'Unable to validate coupon' };
  }

  try {
    const q = adminDb.collection('coupons').where('code', '==', code.toUpperCase());
    const snapshot = await q.get();
    if (snapshot.empty) {
      return { valid: false, discount: 0, error: 'Invalid coupon code' };
    }

    const couponDoc = snapshot.docs[0];
    const coupon = couponDoc.data();

    if (!coupon.isActive) {
      return { valid: false, discount: 0, error: 'This coupon is no longer active' };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    if (now < validFrom || now > validUntil) {
      return { valid: false, discount: 0, error: 'This coupon has expired or is not yet valid' };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, error: 'This coupon has reached its usage limit' };
    }

    if (coupon.applicableOutlets && coupon.applicableOutlets.length > 0) {
      if (!coupon.applicableOutlets.includes(outletId)) {
        return { valid: false, discount: 0, error: 'This coupon is not valid at the selected outlet' };
      }
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        error: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    discount = Math.round(discount * 100) / 100;

    return { valid: true, discount, error: undefined };
  } catch {
    return { valid: false, discount: 0, error: 'Unable to validate coupon' };
  }
}

export async function calculateOrderTotal(
  cartItems: CartItemRequest[],
  outletId: string,
  couponCode?: string
): Promise<PricingResult> {
  const errors: string[] = [];
  const verified: VerifiedItem[] = [];

  let menuItemMap: Record<string, any>;
  try {
    menuItemMap = await fetchMenuItems();
  } catch (e: any) {
    return { items: [], subtotal: 0, tax: 0, discount: 0, total: 0, errors: [e.message || 'Pricing unavailable'] };
  }

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

    const inclusiveOfGst = menuItem.inclusiveOfGst || false;
    const menuAddons: CartItemAddon[] = menuItem.addons || [];
    const validAddons: CartItemAddon[] = [];
    let addonTotal = 0;

    if (cartItem.addons && cartItem.addons.length > 0) {
      for (const reqAddon of cartItem.addons) {
        const menuAddon = menuAddons.find(
          (ma: CartItemAddon) => ma.name === reqAddon.name && ma.price === reqAddon.price
        );
        if (!menuAddon) {
          errors.push(`Invalid addon "${reqAddon.name}" for ${menuItem.name}`);
          continue;
        }
        validAddons.push({ name: menuAddon.name, price: menuAddon.price });
        addonTotal += menuAddon.price;
      }
    }

    verified.push({
      menuItemId: cartItem.menuItemId,
      name: menuItem.name,
      price,
      quantity,
      available: true,
      addons: validAddons,
      addonTotal,
      inclusiveOfGst,
    });
  }

  let subtotal = 0;
  let tax = 0;

  for (const item of verified) {
    const unitPrice = item.price + item.addonTotal;
    if (item.inclusiveOfGst) {
      const unitBase = unitPrice / (1 + TAX_RATE);
      subtotal += Math.round(unitBase * item.quantity * 100) / 100;
      tax += Math.round((unitPrice - unitBase) * item.quantity * 100) / 100;
    } else {
      subtotal += Math.round(unitPrice * item.quantity * 100) / 100;
      tax += Math.round(unitPrice * TAX_RATE * item.quantity * 100) / 100;
    }
  }

  let discount = 0;
  let couponCodeApplied: string | undefined;
  let couponError: string | undefined;

  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, subtotal, outletId);
    if (couponResult.valid) {
      discount = couponResult.discount;
      couponCodeApplied = couponCode.toUpperCase();
    } else {
      couponError = couponResult.error;
    }
  }

  const total = Math.round((subtotal + tax - discount) * 100) / 100;

  return {
    items: verified,
    subtotal,
    tax,
    discount,
    total: Math.max(0, total),
    couponCode: couponCodeApplied,
    couponError,
    errors,
  };
}
