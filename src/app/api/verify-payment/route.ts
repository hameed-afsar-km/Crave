import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAuth, getAdminDb } from '@/lib/firebase-admin';
import { rateLimit } from '@/lib/rate-limiter';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const MAX_AMOUNT = 100000;

function validateOrderData(body: any): string | null {
  if (body.items && (!Array.isArray(body.items) || body.items.length === 0)) {
    return 'Invalid items';
  }
  if (body.items && body.items.some((i: any) => !i.menuItemId || !i.name)) {
    return 'Invalid item structure';
  }
  if (body.outletId && typeof body.outletId !== 'string') {
    return 'Invalid outlet';
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ verified: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit(`verify-payment:${auth.uid}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { verified: false, error: `Too many requests. Try again in ${rl.resetIn}s` },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, expectedAmount, expectedCurrency } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Missing payment fields' }, { status: 400 });
    }

    if (typeof razorpay_order_id !== 'string' || !/^order_[a-zA-Z0-9]+$/.test(razorpay_order_id)) {
      return NextResponse.json({ verified: false, error: 'Invalid order ID format' }, { status: 400 });
    }
    if (typeof razorpay_payment_id !== 'string' || !/^pay_[a-zA-Z0-9]+$/.test(razorpay_payment_id)) {
      return NextResponse.json({ verified: false, error: 'Invalid payment ID format' }, { status: 400 });
    }
    if (typeof razorpay_signature !== 'string' || !/^[a-f0-9]{64}$/.test(razorpay_signature)) {
      return NextResponse.json({ verified: false, error: 'Invalid signature format' }, { status: 400 });
    }

    if (expectedAmount !== undefined && (typeof expectedAmount !== 'number' || expectedAmount <= 0 || expectedAmount > MAX_AMOUNT)) {
      return NextResponse.json({ verified: false, error: 'Invalid amount' }, { status: 400 });
    }

    const validationError = validateOrderData(body);
    if (validationError) {
      return NextResponse.json({ verified: false, error: validationError }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest('hex');

    if (digest !== razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Invalid signature' }, { status: 400 });
    }

    let paymentDetails: any;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch {
      return NextResponse.json({ verified: false, error: 'Payment not found' }, { status: 400 });
    }

    if (!paymentDetails || paymentDetails.id !== razorpay_payment_id) {
      return NextResponse.json({ verified: false, error: 'Payment mismatch' }, { status: 400 });
    }

    if (paymentDetails.order_id !== razorpay_order_id) {
      return NextResponse.json({ verified: false, error: 'Order mismatch' }, { status: 400 });
    }

    if (paymentDetails.status !== 'captured') {
      return NextResponse.json({
        verified: false,
        error: `Payment not captured (status: ${paymentDetails.status})`,
      }, { status: 400 });
    }

    const paymentCurrency = paymentDetails.currency || 'INR';
    if (expectedCurrency && paymentCurrency !== expectedCurrency) {
      return NextResponse.json({ verified: false, error: 'Currency mismatch' }, { status: 400 });
    }

    const paymentAmount = (paymentDetails.amount || 0) / 100;
    if (expectedAmount && Math.abs(paymentAmount - expectedAmount) > 0.01) {
      return NextResponse.json({ verified: false, error: 'Amount mismatch' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ verified: false, error: 'Service unavailable' }, { status: 500 });
    }

    let orderId: string | null = null;
    let duplicate = false;

    try {
      const result = await adminDb.runTransaction(async (transaction) => {
        const lockRef = adminDb.collection('paymentLocks').doc(razorpay_payment_id);
        const lockDoc = await transaction.get(lockRef);

        if (lockDoc.exists) {
          const data = lockDoc.data();
          if (data?.orderId) {
            return { orderId: data.orderId, duplicate: true };
          }
          return { orderId: null, duplicate: false };
        }

        const now = new Date().toISOString();

        transaction.set(lockRef, {
          paymentId: razorpay_payment_id,
          status: 'completed',
          orderId: null,
          createdAt: now,
        });

        const orderRef = adminDb.collection('orders').doc();
        transaction.set(orderRef, {
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          outletId: body.outletId || 'lic',
          outletName: body.outletName || '',
          customerId: auth.uid,
          customerName: body.customerName || '',
          customerPhone: body.customerPhone || '',
          customerEmail: body.customerEmail || '',
          items: (body.items || []).map((i: any) => ({
            menuItemId: i.menuItemId || '',
            name: i.name || '',
            quantity: i.quantity || 0,
            unitPrice: i.unitPrice || 0,
            subtotal: i.subtotal || 0,
          })),
          amount: expectedAmount || paymentAmount,
          paymentStatus: 'paid',
          status: 'received',
          pickupTime: body.pickupTime || '',
          estimatedWaitTime: 18,
          pointsEarned: body.pointsEarned || 0,
          createdAt: now,
        });

        transaction.update(lockRef, { orderId: orderRef.id });

        return { orderId: orderRef.id, duplicate: false };
      });

      orderId = result.orderId;
      duplicate = result.duplicate;
    } catch {
      return NextResponse.json({ verified: false, error: 'Failed to confirm order' }, { status: 500 });
    }

    if (duplicate) {
      return NextResponse.json({
        verified: true,
        duplicate: true,
        existingOrderId: orderId,
        amount: paymentAmount,
        currency: paymentCurrency,
      });
    }

    return NextResponse.json({
      verified: true,
      orderId,
      amount: paymentAmount,
      currency: paymentCurrency,
    });
  } catch (err: any) {
    console.error('verify-payment error:', err);
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 });
  }
}
