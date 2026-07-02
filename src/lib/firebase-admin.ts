import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore';

let adminInitialized = false;
let adminDb: Firestore | null = null;
let initError: string | null = null;

function getServiceAccountBase64(): string {
  const val = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!val) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is required');
  }
  return val;
}

function initAdmin(): boolean {
  if (adminInitialized) return true;
  if (initError) return false;
  if (getApps().length) {
    if (adminDb) return true;
    try {
      adminDb = getAdminFirestore();
      adminInitialized = true;
      return true;
    } catch {
      initError = 'Failed to initialize Firestore';
      return false;
    }
  }

  const base64 = getServiceAccountBase64();

  try {
    const serviceAccount = JSON.parse(
      Buffer.from(base64, 'base64').toString('utf-8')
    );
    initializeApp({ credential: cert(serviceAccount) });
    adminDb = getAdminFirestore();
    adminInitialized = true;
    return true;
  } catch (e: any) {
    initError = `Failed to initialize Firebase Admin: ${e?.message || 'Unknown error'}`;
    return false;
  }
}

export function getAdminAuth() {
  if (!initAdmin()) return null;
  try {
    return getAuth();
  } catch {
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  if (!initAdmin()) return null;
  return adminDb;
}

export function getAdminInitError(): string | null {
  return initError;
}

export async function verifyFirebaseToken(token: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return null;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    if (!decoded?.uid || !decoded?.exp || !decoded?.iat) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }
    if (decoded.iat > now + 300) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<{ uid: string; email: string; role: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return null;
  }

  const decoded = await verifyFirebaseToken(token);
  if (!decoded?.uid) {
    return null;
  }

  return {
    uid: decoded.uid,
    email: decoded.email || '',
    role: decoded.role || 'customer',
  };
}
