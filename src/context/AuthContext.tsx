'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole } from '@/types';
import { saveUserProfile, getUserProfile } from '@/lib/firestore-service';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthCookie = useCallback((userData: UserProfile) => {
    const payload = JSON.stringify({
      email: userData.email,
      role: userData.role || 'customer',
      assignedOutletId: userData.assignedOutletId || '',
      assignedOutletName: userData.assignedOutletName || '',
    });
    document.cookie = `crave-user=${encodeURIComponent(payload)};path=/;max-age=2592000;SameSite=Lax`;
  }, []);

  const clearAuthCookie = useCallback(() => {
    document.cookie = 'crave-user=;path=/;max-age=0';
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('crave-user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        setUser(parsed);
        setAuthCookie(parsed);
        if (parsed.uid) {
          getUserProfile(parsed.uid).then((firestoreUser) => {
            if (firestoreUser) {
              setUser(firestoreUser);
              localStorage.setItem('crave-user', JSON.stringify(firestoreUser));
              setAuthCookie(firestoreUser);
            }
          });
        }
      } catch { }
    }
    setLoading(false);
  }, [setAuthCookie]);

  const signIn = useCallback((userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('crave-user', JSON.stringify(userData));
    setAuthCookie(userData);
    if (userData.uid) {
      saveUserProfile(userData.uid, userData);
    }
  }, [setAuthCookie]);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('crave-user');
    clearAuthCookie();
  }, [clearAuthCookie]);

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
  }, [setAuthCookie]);

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
