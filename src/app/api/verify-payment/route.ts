import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { rateLimit } from '@/lib/rate-limiter';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    if (expectedAmount !== undefined && (typeof expectedAmount !== 'number' || expectedAmount <= 0 || expectedAmount > 100000)) {
      return NextResponse.json({ verified: false, error: 'Invalid amount' }, { status: 400 });
    }

    if (expectedCurrency && typeof expectedCurrency !== 'string') {
      return NextResponse.json({ verified: false, error: 'Invalid currency' }, { status: 400 });
    }

    // 1. Verify HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest('hex');

    if (digest !== razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Fetch payment details from Razorpay
    let paymentDetails: any;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch {
      return NextResponse.json({ verified: false, error: 'Payment not found' }, { status: 400 });
    }

    if (!paymentDetails || paymentDetails.id !== razorpay_payment_id) {
      return NextResponse.json({ verified: false, error: 'Payment mismatch' }, { status: 400 });
    }

    // 3. Verify the payment belongs to the expected order
    if (paymentDetails.order_id !== razorpay_order_id) {
      return NextResponse.json({ verified: false, error: 'Order mismatch' }, { status: 400 });
    }

    // 4. Verify payment is captured (not just authorized)
    if (paymentDetails.status !== 'captured') {
      return NextResponse.json({
        verified: false,
        error: `Payment not captured (status: ${paymentDetails.status})`,
      }, { status: 400 });
    }

    // 5. Verify currency
    const paymentCurrency = paymentDetails.currency || 'INR';
    if (expectedCurrency && paymentCurrency !== expectedCurrency) {
      return NextResponse.json({ verified: false, error: 'Currency mismatch' }, { status: 400 });
    }

    // 6. Verify amount matches expected (server-calculated) amount
    const paymentAmount = (paymentDetails.amount || 0) / 100; // Razorpay amounts are in paise
    if (expectedAmount && Math.abs(paymentAmount - expectedAmount) > 0.01) {
      return NextResponse.json({ verified: false, error: 'Amount mismatch' }, { status: 400 });
    }

    // 7. Check for duplicate payment (idempotency)
    if (db) {
      try {
        const existingOrders = await getDocs(
          query(collection(db, 'orders'), where('paymentId', '==', razorpay_payment_id))
        );
        if (!existingOrders.empty) {
          // Payment already used — return existing order
          const existing = existingOrders.docs[0];
          return NextResponse.json({
            verified: true,
            duplicate: true,
            existingOrderId: existing.id,
          });
        }
      } catch {
        // Firestore unavailable — skip dedup check
      }
    }

    return NextResponse.json({ verified: true, amount: paymentAmount, currency: paymentCurrency });
  } catch (err: any) {
    console.error('verify-payment error:', err);
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 });
  }
}
