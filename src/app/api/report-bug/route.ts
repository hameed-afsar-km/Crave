import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/firebase-admin';
import { rateLimit } from '@/lib/rate-limiter';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit(`report-bug:${auth.uid}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetIn}s` },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    const body = await req.json();
    const { description, severity, pageUrl } = body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (description.length > 5000) {
      return NextResponse.json({ error: 'Description too long' }, { status: 400 });
    }

    if (severity && !['minor', 'major', 'critical'].includes(severity)) {
      return NextResponse.json({ error: 'Invalid severity' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const { db } = await import('@/lib/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    if (!db) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    await addDoc(collection(db, 'bugReports'), {
      description: description.trim().slice(0, 5000),
      severity: severity || 'minor',
      pageUrl: typeof pageUrl === 'string' ? pageUrl.slice(0, 500) : '',
      userId: auth.uid,
      userEmail: auth.email,
      userName: '',
      status: 'open',
      adminNotes: '',
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('report-bug error:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
