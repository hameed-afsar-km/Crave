'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
import { UserProfile, UserRole } from '@/types';
import { saveUserProfile, getUserProfile } from '@/lib/firestore-service';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { logAction } from '@/lib/audit';

const SESSION_TIMEOUT_MS = 1800_000; // 30 minutes

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (user: UserProfile) => void;
  signOut: () => void;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  isOutletManager: boolean;
  isOutletStaff: boolean;
  isStaff: boolean;
  userRole: UserRole | null;
  assignedOutletId: string | null;
  assignedOutletName: string;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kmafsar2006@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setAuthCookie(userData: UserProfile) {
  // Only store essential non-sensitive data in cookie
  // User roles, outlet assignments, and other permissions must come from Firebase token
  const payload = JSON.stringify({
    uid: userData.uid,
    email: userData.email,
  });
  document.cookie = `crave-user=${encodeURIComponent(payload)};path=/;max-age=2592000;SameSite=Strict;Secure`;
}

function clearAuthCookie() {
  const domains = ['', `;domain=${window.location.hostname}`];
  const paths = ['/', '/auth', '/admin', '/checkout', '/orders', '/profile'];
  for (const suffix of ['crave-user', 'crave-token', 'crave-session']) {
    for (const domain of domains) {
      for (const path of paths) {
        document.cookie = `${suffix}=;path=${path}${domain};max-age=0;SameSite=Strict;Secure`;
      }
    }
  }
}

async function setTokenCookie() {
  if (!auth) return;
  try {
    const token = await getIdToken(auth.currentUser!, true);
    document.cookie = `crave-token=${token};path=/;max-age=1800;SameSite=Strict;Secure`;
  } catch {
    clearAuthCookie();
  }
}

function clearAllStorage() {
  localStorage.removeItem('crave-admin-outlet');
  localStorage.removeItem('crave-push-subscription');
  localStorage.removeItem('crave-sw-registered');
  sessionStorage.clear();
  try {
    if ('indexedDB' in window) {
      indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(0);

  const performSignOut = useCallback(async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch {
      // Continue cleanup even if signOut fails
    }
    setUser(null);
    clearAllStorage();
    clearAuthCookie();
  }, []);

  const resetSessionTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    sessionTimerRef.current = setTimeout(() => {
      performSignOut();
    }, SESSION_TIMEOUT_MS);
  }, [performSignOut]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handler = () => resetSessionTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    resetSessionTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [resetSessionTimer]);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase Auth has a real session — use it
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
            setAuthCookie(profile);
          } else {
            // User exists in Firebase Auth but not in Firestore — create minimal profile
            const minimal: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              role: 'customer',
            };
            setUser(minimal);
            setAuthCookie(minimal);
            saveUserProfile(firebaseUser.uid, minimal);
          }
          await setTokenCookie();
        } catch {
          // Firebase available but Firestore read failed — fall through
        }
        setLoading(false);
      } else {
        // No Firebase Auth session — clear cookies
        clearAuthCookie();
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback((userData: UserProfile) => {
    setUser(userData);
    setAuthCookie(userData);
    if (userData.uid) {
      saveUserProfile(userData.uid, userData);
    }
    resetSessionTimer();
  }, [resetSessionTimer]);

  const signOut = useCallback(() => {
    performSignOut();
  }, [performSignOut]);

  const updateUser = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      setAuthCookie(updated);
      if (updated.uid) {
        saveUserProfile(updated.uid, updated);
      }
      return updated;
    });
  }, []);

  const userRole = useMemo(() => user?.role || null, [user]);

  const isMasterAdmin = useMemo(() => {
    if (user?.role === 'admin') return true;
    if (user?.email === ADMIN_EMAIL) return true;
    return false;
  }, [user]);

  const isOutletManager = useMemo(() => user?.role === 'outlet_manager', [user]);
  const isOutletStaff = useMemo(() => user?.role === 'outlet_staff', [user]);
  const isStaff = useMemo(() => isMasterAdmin || isOutletManager || isOutletStaff, [isMasterAdmin, isOutletManager, isOutletStaff]);

  const isAdmin = useMemo(() => isMasterAdmin, [isMasterAdmin]);

  const assignedOutletId = useMemo(() => user?.assignedOutletId || null, [user]);
  const assignedOutletName = useMemo(() => user?.assignedOutletName || '', [user]);

  const value = useMemo(() => ({
    user, loading, signIn, signOut, isAdmin, isMasterAdmin,
    isOutletManager, isOutletStaff, isStaff,
    userRole, assignedOutletId, assignedOutletName, updateUser,
  }), [user, loading, signIn, signOut, isAdmin, isMasterAdmin,
      isOutletManager, isOutletStaff, isStaff, userRole, assignedOutletId, assignedOutletName, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
