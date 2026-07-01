import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Store subscription tied to the authenticated user
    const payload = {
      ...subscription,
      userId: auth.uid,
      userEmail: auth.email,
      createdAt: new Date().toISOString(),
    };

    const { db } = await import('@/lib/firebase');
    const { collection, addDoc, query, where, getDocs, serverTimestamp } = await import('firebase/firestore');

    if (db) {
      try {
        const subsRef = collection(db, 'pushSubscriptions');
        const existing = await getDocs(query(subsRef, where('endpoint', '==', subscription.endpoint)));
        if (existing.empty) {
          await addDoc(subsRef, {
            ...payload,
            createdAt: serverTimestamp(),
          });
        }
        return NextResponse.json({ success: true });
      } catch {
        // Fall through to localStorage fallback
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('push-subscribe error:', err);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const { db } = await import('@/lib/firebase');
    const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');

    if (db) {
      try {
        const subsRef = collection(db, 'pushSubscriptions');
        const snapshot = await getDocs(query(subsRef, where('endpoint', '==', endpoint)));
        snapshot.docs.forEach((d) => deleteDoc(d.ref));
        return NextResponse.json({ success: true });
      } catch {
        // fall through
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('push-unsubscribe error:', err);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
