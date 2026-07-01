import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore';

const FIREBASE_ADMIN_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'crave-538c0';

let adminDb: Firestore | null = null;

function initAdmin() {
  if (getApps().length) return;

  // Try service account from env var first
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
      );
      initializeApp({ credential: cert(serviceAccount) });
      adminDb = getAdminFirestore();
      return;
    } catch {
      // fall through
    }
  }

  // Fallback: initialize with project ID only
  // Token verification works without credentials (fetches JWKS keys from Google)
  // Firestore reads without credentials will fail — caller must handle fallback
  try {
    initializeApp({ projectId: FIREBASE_ADMIN_PROJECT_ID });
  } catch {
    // Admin SDK unavailable
  }
}

initAdmin();

export function getAdminAuth() {
  try {
    return getAuth();
  } catch {
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  if (adminDb) return adminDb;
  try {
    adminDb = getAdminFirestore();
    return adminDb;
  } catch {
    return null;
  }
}

export async function verifyFirebaseToken(token: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    // Fallback: basic JWT decode (no signature verification)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      if (payload.exp && payload.exp * 1000 < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
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
