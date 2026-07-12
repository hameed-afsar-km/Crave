import { NextResponse } from 'next/server';
import { requireAuth, getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const authUser = await requireAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated in API' }, { status: 401 });
    }

    const db = getAdminDb();
    const adminAuth = getAdminAuth();
    if (!db || !adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin SDK not initialized correctly' }, { status: 500 });
    }

    // 1. Get user document from Firestore
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // 2. Get user custom claims from Firebase Auth
    const userRecord = await adminAuth.getUser(authUser.uid);
    const customClaims = userRecord.customClaims || {};

    return NextResponse.json({
      uid: authUser.uid,
      email: authUser.email,
      apiRole: authUser.role,
      firestoreUserDocExists: userDoc.exists,
      firestoreUserRole: userData?.role || 'not_set',
      firebaseAuthCustomClaims: customClaims,
      fullFirestoreData: userData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
