import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/firebase-admin';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const auth = await requireStaff(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const snapshot = await db.collection('users').orderBy('name').get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'customer',
        assignedOutletId: data.assignedOutletId || null,
        assignedOutletName: data.assignedOutletName || null,
        photoURL: data.photoURL || null,
        updatedAt: data.updatedAt?.toMillis?.() || null,
      };
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
