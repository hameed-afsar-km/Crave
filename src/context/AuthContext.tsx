'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (user: UserProfile) => void;
  signOut: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('crave-user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch { }
    }
    setLoading(false);
  }, []);

  const signIn = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('crave-user', JSON.stringify(userData));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('crave-user');
  };

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const value = useMemo(() => ({
    user, loading, signIn, signOut, isAdmin,
  }), [user, loading, isAdmin]);

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
