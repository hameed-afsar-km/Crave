import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/firebase-admin';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const MAX_ORDER_AMOUNT = 100000; // ₹1,000.00 max per order

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency = 'INR', receipt, outletId, outletName } = await req.json();

    if (!amount || amount <= 0 || amount > MAX_ORDER_AMOUNT) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        uid: auth.uid,
        email: auth.email,
        outletId: outletId || '',
        outletName: outletName || '',
      },
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      outletId: order.notes?.outletId,
      outletName: order.notes?.outletName,
    });
  } catch (err: any) {
    console.error('create-order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
