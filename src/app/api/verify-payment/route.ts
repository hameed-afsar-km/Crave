import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ verified: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Missing payment fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest('hex');

    const verified = digest === razorpay_signature;

    return NextResponse.json({ verified });
  } catch (err: any) {
    console.error('verify-payment error:', err);
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 });
  }
}
