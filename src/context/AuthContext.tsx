'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole } from '@/types';
import { saveUserProfile, getUserProfile } from '@/lib/firestore-service';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';

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
  document.cookie = 'crave-user=;path=/;max-age=0';
  document.cookie = 'crave-token=;path=/;max-age=0';
}

async function setTokenCookie() {
  if (!auth) return;
  try {
    const token = await getIdToken(auth.currentUser!, false);
    document.cookie = `crave-token=${token};path=/;max-age=1800;SameSite=Lax;Secure`;
  } catch {
    // silently fail — token cookie is optional
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
            localStorage.setItem('crave-user', JSON.stringify(profile));
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
            localStorage.setItem('crave-user', JSON.stringify(minimal));
            setAuthCookie(minimal);
            saveUserProfile(firebaseUser.uid, minimal);
          }
          await setTokenCookie();
        } catch {
          // Firebase available but Firestore read failed — fall through
        }
        setLoading(false);
      } else {
        // No Firebase Auth session — fall back to localStorage
        const saved = localStorage.getItem('crave-user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as UserProfile;
            setUser(parsed);
            setAuthCookie(parsed);
          } catch { }
        }
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback((userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('crave-user', JSON.stringify(userData));
    setAuthCookie(userData);
    if (userData.uid) {
      saveUserProfile(userData.uid, userData);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('crave-user');
    localStorage.removeItem('crave-points');
    localStorage.removeItem('crave-redeemed');
    clearAuthCookie();
  }, []);

  const updateUser = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('crave-user', JSON.stringify(updated));
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
