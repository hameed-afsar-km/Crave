'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
import { UserProfile, UserRole } from '@/types';
import { saveUserProfile, getUserProfile } from '@/lib/firestore-service';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, getIdToken, getIdTokenResult } from 'firebase/auth';

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
  canAccessDashboard: boolean;
  canManageOrders: boolean;
  canManageKitchen: boolean;
  canManageMenu: boolean;
  canManageSettings: boolean;
  canManageOutlets: boolean;
  canManageAnalytics: boolean;
  canViewLogs: boolean;
  canManageBugs: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setAuthCookie(userData: UserProfile) {
  const payload = JSON.stringify({
    uid: userData.uid,
    email: userData.email,
  });
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `crave-user=${encodeURIComponent(payload)};path=/;max-age=2592000;SameSite=Lax${isSecure ? ';Secure' : ''}`;
}

function clearAuthCookie() {
  const isSecure = window.location.protocol === 'https:';
  const samesite = 'Lax';
  for (const suffix of ['crave-user', 'crave-token', 'crave-session']) {
    document.cookie = `${suffix}=;path=/;max-age=0;SameSite=${samesite}${isSecure ? ';Secure' : ''}`;
  }
}

async function setTokenCookie() {
  if (!auth) return;
  try {
    const token = await getIdToken(auth.currentUser!, true);
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `crave-token=${token};path=/;max-age=1800;SameSite=Lax${isSecure ? ';Secure' : ''}`;
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
        try {
          // Use custom claims for fast initial render while Firestore loads
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          let claimRole = tokenResult.claims.role as string | undefined;
          if (claimRole && !['customer', 'outlet_staff', 'outlet_manager', 'admin'].includes(claimRole)) {
            claimRole = undefined;
          }

          // Firestore is authoritative — always read profile
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            if (!profile.role) {
              profile.role = (claimRole as UserProfile['role']) || 'customer';
              saveUserProfile(firebaseUser.uid, profile).catch(() => {});
            }
            setUser(profile);
            setAuthCookie(profile);
          } else if (claimRole) {
            // No Firestore profile yet — use claim role as estimate
            const minimal: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              role: claimRole as any,
            };
            setUser(minimal);
            setAuthCookie(minimal);
            saveUserProfile(firebaseUser.uid, minimal).catch(() => {});
          } else {
            const minimal: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              role: 'customer',
            };
            setUser(minimal);
            setAuthCookie(minimal);
            saveUserProfile(firebaseUser.uid, minimal).catch(() => {});
          }
        } catch {
          // Profile loading may fail — continue anyway
        }
        await setTokenCookie();
        setLoading(false);
      } else {
        clearAuthCookie();
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback((userData: UserProfile) => {
    setUser(userData);
    setAuthCookie(userData);
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
        saveUserProfile(updated.uid, updated).catch(() => {});
      }
      return updated;
    });
  }, []);

  const userRole = useMemo(() => user?.role || null, [user]);

  const isMasterAdmin = useMemo(() => user?.role === 'admin', [user]);

  const isOutletManager = useMemo(() => user?.role === 'outlet_manager', [user]);
  const isOutletStaff = useMemo(() => user?.role === 'outlet_staff', [user]);
  const isStaff = useMemo(() => isMasterAdmin || isOutletManager || isOutletStaff, [isMasterAdmin, isOutletManager, isOutletStaff]);

  const isAdmin = useMemo(() => isMasterAdmin, [isMasterAdmin]);

  const assignedOutletId = useMemo(() => user?.assignedOutletId || null, [user]);
  const assignedOutletName = useMemo(() => user?.assignedOutletName || '', [user]);

  const canAccessDashboard = useMemo(() => isStaff, [isStaff]);
  const canManageOrders = useMemo(() => isStaff, [isStaff]);
  const canManageKitchen = useMemo(() => isStaff, [isStaff]);
  const canManageMenu = useMemo(() => isStaff, [isStaff]);
  const canManageSettings = useMemo(() => isMasterAdmin, [isMasterAdmin]);
  const canManageOutlets = useMemo(() => isMasterAdmin, [isMasterAdmin]);
  const canManageAnalytics = useMemo(() => isMasterAdmin || isOutletManager, [isMasterAdmin, isOutletManager]);
  const canViewLogs = useMemo(() => isMasterAdmin, [isMasterAdmin]);
  const canManageBugs = useMemo(() => isMasterAdmin, [isMasterAdmin]);

  const value = useMemo(() => ({
    user, loading, signIn, signOut, isAdmin, isMasterAdmin,
    isOutletManager, isOutletStaff, isStaff,
    userRole, assignedOutletId, assignedOutletName, updateUser,
    canAccessDashboard, canManageOrders, canManageKitchen, canManageMenu,
    canManageSettings, canManageOutlets, canManageAnalytics, canViewLogs, canManageBugs,
  }), [user, loading, signIn, signOut, isAdmin, isMasterAdmin,
      isOutletManager, isOutletStaff, isStaff, userRole, assignedOutletId, assignedOutletName, updateUser,
      canAccessDashboard, canManageOrders, canManageKitchen, canManageMenu,
      canManageSettings, canManageOutlets, canManageAnalytics, canViewLogs, canManageBugs]);

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
