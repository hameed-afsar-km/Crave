import { NextResponse } from 'next/server';
import { requireStaff, getAdminDb, syncUserRoleToClaims } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_ROLES = ['customer', 'outlet_staff', 'outlet_manager', 'admin'];

export async function POST(req: Request) {
  try {
    const auth = await requireStaff(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { uid, role, assignedOutletId, assignedOutletName } = body;

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (role) {
      updates.role = role;
    }
    if (assignedOutletId !== undefined) {
      updates.assignedOutletId = assignedOutletId || null;
      updates.assignedOutletName = assignedOutletName || null;
    }

    await db.collection('users').doc(uid).update(updates);

    if (role) {
      await syncUserRoleToClaims(uid);
    }

    const now = new Date();
    const expireAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await db.collection('auditLogs').add({
      action: 'user.role_updated',
      targetType: 'user',
      targetId: uid,
      details: { role, assignedOutletId },
      userEmail: auth.email ? auth.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'unknown',
      userRole: auth.role || 'unknown',
      userName: (auth as any).name || 'unknown',
      createdAt: FieldValue.serverTimestamp(),
      expireAt,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
