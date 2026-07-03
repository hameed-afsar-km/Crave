import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getAdminDb } from '@/lib/firebase-admin';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(signature);
    if (expectedBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

async function handlePaymentCaptured(adminDb: any, payment: any) {
  const paymentId = payment.id;
  const razorpayOrderId = payment.order_id;

  const existing = await adminDb.collection('orders').where('paymentId', '==', paymentId).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    if (doc.data().paymentStatus !== 'paid') {
      await doc.ref.update({ paymentStatus: 'paid', updatedAt: new Date().toISOString() });
    }
    return;
  }

  let notes: any = {};
  try {
    const order = await razorpay.orders.fetch(razorpayOrderId);
    notes = order.notes || {};
  } catch {
    // proceed with empty notes
  }

  let parsedItems: any[];
  try {
    parsedItems = notes.items ? JSON.parse(notes.items) : [];
  } catch {
    parsedItems = [];
  }

  if (parsedItems.length === 0) {
    const amount = (payment.amount || 0) / 100;
    parsedItems = [{ name: 'See admin for item details', qty: 1, price: amount }];
  }

  const amount = (payment.amount || 0) / 100;

  await adminDb.collection('orders').add({
    paymentId,
    razorpayOrderId,
    outletId: notes.outletId || 'unknown',
    outletName: notes.outletName || '',
    customerId: notes.uid || 'unknown',
    customerName: notes.customerName || 'Webhook Recovery',
    customerPhone: notes.customerPhone || '',
    customerEmail: notes.email || '',
    items: parsedItems.map((i: any) => ({
      menuItemId: i.id || '',
      name: i.n || i.name || 'Item',
      quantity: i.q || i.quantity || 1,
      unitPrice: i.p || i.price || 0,
      subtotal: (i.p || i.price || 0) * (i.q || i.quantity || 1),
    })),
    amount,
    paymentStatus: 'paid',
    status: 'received',
    pickupTime: notes.pickupTime || '',
    estimatedWaitTime: 18,
    pointsEarned: 0,
    createdAt: new Date().toISOString(),
    notes: 'Auto-recovered via Razorpay webhook',
  });
}

async function handlePaymentFailed(adminDb: any, payment: any) {
  const paymentId = payment.id;
  const existing = await adminDb.collection('orders').where('paymentId', '==', paymentId).get();
  if (!existing.empty) {
    await existing.docs[0].ref.update({
      paymentStatus: 'failed',
      status: 'cancelled',
      cancelReason: 'Payment failed',
      updatedAt: new Date().toISOString(),
    });
  }
}

async function handleRefundCreated(adminDb: any, refund: any) {
  const paymentId = refund.payment_id;
  const existing = await adminDb.collection('orders').where('paymentId', '==', paymentId).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const currentNotes = doc.data().notes || '';
    await doc.ref.update({
      paymentStatus: 'refunded',
      notes: currentNotes
        ? `${currentNotes} | Refund ${refund.id}: ${refund.status}`
        : `Refund ${refund.id}: ${refund.status}`,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function handleOrderPaid(adminDb: any, orderEvent: any) {
  const razorpayOrderId = orderEvent.id;
  const existing = await adminDb.collection('orders').where('razorpayOrderId', '==', razorpayOrderId).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    if (doc.data().paymentStatus !== 'paid') {
      await doc.ref.update({ paymentStatus: 'paid', updatedAt: new Date().toISOString() });
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature || !verifySignature(body, signature, WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firestore not available' }, { status: 500 });
    }

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(adminDb, event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(adminDb, event.payload.payment.entity);
        break;
      case 'refund.created':
        await handleRefundCreated(adminDb, event.payload.refund.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(adminDb, event.payload.order.entity);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
