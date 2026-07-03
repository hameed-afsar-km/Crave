import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getAdminDb } from '@/lib/firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

let processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 1000;

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

function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

function markEventProcessed(eventId: string) {
  processedEvents.add(eventId);
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const first = processedEvents.values().next().value;
    if (first) processedEvents.delete(first);
  }
}

async function handlePaymentCaptured(adminDb: Firestore, payment: any, eventId: string) {
  if (isEventProcessed(eventId)) return;

  const paymentId = payment.id;

  const lockRef = adminDb.collection('paymentLocks').doc(paymentId);
  const lockDoc = await lockRef.get();

  if (lockDoc.exists) {
    const orderId = lockDoc.data()?.orderId;
    if (orderId) {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      if (orderDoc.exists && orderDoc.data()?.paymentStatus !== 'paid') {
        await orderRef.update({
          paymentStatus: 'paid',
          updatedAt: new Date().toISOString(),
        });
      }
    }
    markEventProcessed(eventId);
    return;
  }

  let notes: any = {};
  try {
    const order = await razorpay.orders.fetch(payment.order_id);
    notes = order.notes || {};
  } catch {
  }

  let parsedItems: any[];
  try {
    parsedItems = notes.items ? JSON.parse(notes.items) : [];
  } catch {
    parsedItems = [];
  }

  if (parsedItems.length === 0) {
    const amount = (payment.amount || 0) / 100;
    parsedItems = [{ id: '', n: 'See admin for item details', q: 1, p: amount }];
  }

  const amount = (payment.amount || 0) / 100;
  const now = new Date().toISOString();

  try {
    await adminDb.runTransaction(async (transaction) => {
      const currentLock = await transaction.get(lockRef);
      if (currentLock.exists) {
        return;
      }

      transaction.set(lockRef, {
        paymentId,
        status: 'completed',
        orderId: null,
        createdAt: now,
      });

      const orderRef = adminDb.collection('orders').doc();
      transaction.set(orderRef, {
        paymentId,
        razorpayOrderId: payment.order_id,
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
        createdAt: now,
        notes: 'Auto-recovered via Razorpay webhook',
      });

      transaction.update(lockRef, { orderId: orderRef.id });
    });
  } catch {
  }

  markEventProcessed(eventId);
}

async function handlePaymentFailed(adminDb: Firestore, payment: any) {
  const paymentId = payment.id;

  const lockRef = adminDb.collection('paymentLocks').doc(paymentId);
  const lockDoc = await lockRef.get();

  if (lockDoc.exists) {
    const orderId = lockDoc.data()?.orderId;
    if (orderId) {
      await adminDb.collection('orders').doc(orderId).update({
        paymentStatus: 'failed',
        status: 'cancelled',
        cancelReason: 'Payment failed',
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    const now = new Date().toISOString();
    const orderRef = adminDb.collection('orders').doc();
    await adminDb.runTransaction(async (transaction) => {
      const currentLock = await transaction.get(lockRef);
      if (currentLock.exists) return;

      transaction.set(lockRef, {
        paymentId,
        status: 'failed',
        orderId: null,
        createdAt: now,
      });

      transaction.set(orderRef, {
        paymentId,
        razorpayOrderId: payment.order_id,
        outletId: 'unknown',
        outletName: '',
        customerId: 'unknown',
        customerName: 'Failed Payment',
        customerPhone: '',
        customerEmail: '',
        items: [],
        amount: (payment.amount || 0) / 100,
        paymentStatus: 'failed',
        status: 'cancelled',
        cancelReason: 'Payment failed',
        pickupTime: '',
        estimatedWaitTime: 0,
        pointsEarned: 0,
        createdAt: now,
        notes: 'Failed payment via Razorpay webhook',
      });

      transaction.update(lockRef, { orderId: orderRef.id });
    });
  }
}

async function handleRefundCreated(adminDb: Firestore, refund: any) {
  const paymentId = refund.payment_id;
  const lockRef = adminDb.collection('paymentLocks').doc(paymentId);
  const lockDoc = await lockRef.get();

  if (lockDoc.exists) {
    const orderId = lockDoc.data()?.orderId;
    if (orderId) {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      if (orderDoc.exists) {
        const currentNotes = orderDoc.data()?.notes || '';
        await orderRef.update({
          paymentStatus: 'refunded',
          notes: currentNotes
            ? `${currentNotes} | Refund ${refund.id}: ${refund.status}`
            : `Refund ${refund.id}: ${refund.status}`,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}

async function handleOrderPaid(adminDb: Firestore, orderEvent: any) {
  const razorpayOrderId = orderEvent.id;
  const lockDocs = await adminDb.collection('paymentLocks')
    .where('razorpayOrderId', '==', razorpayOrderId)
    .get();

  for (const doc of lockDocs.docs) {
    const orderId = doc.data()?.orderId;
    if (orderId) {
      const orderRef = adminDb.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      if (orderDoc.exists && orderDoc.data()?.paymentStatus !== 'paid') {
        await orderRef.update({
          paymentStatus: 'paid',
          updatedAt: new Date().toISOString(),
        });
      }
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
    const eventId = event.event_id || `${event.event}_${Date.now()}`;
    const eventType = event.event;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firestore not available' }, { status: 500 });
    }

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(adminDb, event.payload.payment.entity, eventId);
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
