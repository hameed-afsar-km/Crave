import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/firebase-admin';
import { calculateOrderTotal } from '@/lib/server-pricing';
import { rateLimit } from '@/lib/rate-limiter';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CartItemRequest {
  menuItemId: string;
  quantity: number;
  name?: string;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit(`create-order:${auth.uid}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetIn}s` },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    const body = await req.json();

    if (!body.cartItems || !Array.isArray(body.cartItems) || body.cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (body.cartItems.length > 50) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    if (!body.outletId || typeof body.outletId !== 'string') {
      return NextResponse.json({ error: 'Outlet is required' }, { status: 400 });
    }

    const cartItems: CartItemRequest[] = body.cartItems.map((item: any) => ({
      menuItemId: String(item.menuItemId || item.id || ''),
      quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
    }));

    if (cartItems.some((i) => !i.menuItemId)) {
      return NextResponse.json({ error: 'Invalid item in cart' }, { status: 400 });
    }

    const pricing = await calculateOrderTotal(cartItems, body.outletId);

    if (pricing.errors.length > 0) {
      return NextResponse.json({ error: pricing.errors.join('. ') }, { status: 400 });
    }

    if (pricing.total <= 0) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }

    const receipt = `rcpt_${Date.now()}_${auth.uid.slice(0, 8)}`;

    const order = await razorpay.orders.create({
      amount: Math.round(pricing.total * 100),
      currency: 'INR',
      receipt,
      notes: {
        uid: auth.uid,
        email: auth.email || '',
        outletId: body.outletId,
        outletName: String(body.outletName || '').slice(0, 100),
        serverTotal: String(pricing.total),
        serverSubtotal: String(pricing.subtotal),
        itemCount: String(pricing.items.length),
        customerName: String(body.customerName || '').slice(0, 100),
        customerPhone: String(body.customerPhone || '').slice(0, 20),
        pickupTime: String(body.pickupTime || '').slice(0, 10),
        items: JSON.stringify(pricing.items.map((i: any) => ({
          id: i.menuItemId, n: i.name, q: i.quantity, p: i.price
        }))).slice(0, 500),
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      total: pricing.total,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      items: pricing.items,
    });
  } catch (err: any) {
    console.error('create-order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
