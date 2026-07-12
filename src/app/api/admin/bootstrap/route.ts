import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

// ONE-TIME BOOTSTRAP — allows the very first user (matching NEXT_PUBLIC_ADMIN_EMAIL)
// to claim admin role. Remove this file after first use.
export async function POST(req: Request) {
  const bootstrapEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!bootstrapEmail) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_ADMIN_EMAIL not configured' }, { status: 500 });
  }

  const db = getAdminDb();
  const adminAuth = getAdminAuth();
  if (!db || !adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Check FIREBASE_SERVICE_ACCOUNT_BASE64 env var.' }, { status: 500 });
  }

  try {
    // Find user by email
    const userRecord = await adminAuth.getUserByEmail(bootstrapEmail);
    const uid = userRecord.uid;

    // Set role to admin in Firestore
    await db.collection('users').doc(uid).set({
      uid,
      email: userRecord.email,
      name: userRecord.displayName || 'Admin',
      phone: userRecord.phoneNumber || '',
      role: 'admin',
      updatedAt: new Date(),
    }, { merge: true });

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role: 'admin' });

    return NextResponse.json({ success: true, uid, email: bootstrapEmail, role: 'admin', message: 'Admin role set. Please sign out and sign back in for the new token claims to take effect.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to bootstrap admin' }, { status: 500 });
  }
}
