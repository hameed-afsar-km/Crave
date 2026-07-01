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

  useEffect(() => {
    const saved = localStorage.getItem('crave-user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        setUser(parsed);
        if (parsed.uid) {
          getUserProfile(parsed.uid).then((firestoreUser) => {
            if (firestoreUser) {
              setUser(firestoreUser);
              localStorage.setItem('crave-user', JSON.stringify(firestoreUser));
            }
          });
        }
      } catch { }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback((userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('crave-user', JSON.stringify(userData));
    if (userData.uid) {
      saveUserProfile(userData.uid, userData);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('crave-user');
  }, []);

  const updateUser = useCallback((data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('crave-user', JSON.stringify(updated));
      if (updated.uid) {
        saveUserProfile(updated.uid, updated);
      }
      return updated;
    });
  }, []);

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
