'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { UserProfile } from '@/types';
import { saveUserProfile, getUserProfile } from '@/lib/firestore-service';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (user: UserProfile) => void;
  signOut: () => void;
  isAdmin: boolean;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setAuthCookie = useCallback((userData: UserProfile) => {
    const payload = JSON.stringify({
      email: userData.email,
      role: userData.role || 'customer',
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

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const value = useMemo(() => ({
    user, loading, signIn, signOut, isAdmin, updateUser,
  }), [user, loading, isAdmin, signIn, signOut, updateUser]);

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
