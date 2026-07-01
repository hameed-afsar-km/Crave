'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { Outlet } from '@/types';
import { useAuth } from './AuthContext';
import { loadOutlets, saveOutlets } from '@/lib/outlets';
import { subscribeOutlets } from '@/lib/firestore-service';

interface AdminOutletContextType {
  outlets: Outlet[];
  selectedOutletId: string;
  setSelectedOutletId: (id: string) => void;
  selectedOutlet: Outlet | null;
  isAllOutlets: boolean;
}

const STORAGE_KEY = 'crave-admin-outlet';

const AdminOutletContext = createContext<AdminOutletContextType | undefined>(undefined);

export function AdminOutletProvider({ children }: { children: ReactNode }) {
  const { isMasterAdmin, assignedOutletId } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>(() => loadOutlets());
  const [selectedOutletId, setSelectedOutletIdState] = useState<string>('all');

  useEffect(() => {
    const unsub = subscribeOutlets((fetched) => {
      setOutlets(fetched);
      saveOutlets(fetched);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isMasterAdmin && assignedOutletId) {
      setSelectedOutletIdState(assignedOutletId);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedOutletIdState(saved);
    }
  }, [isMasterAdmin, assignedOutletId]);

  const setSelectedOutletId = useCallback((id: string) => {
    setSelectedOutletIdState(id);
    if (isMasterAdmin) {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, [isMasterAdmin]);

  const selectedOutlet = useMemo(() => {
    if (selectedOutletId === 'all') return null;
    return outlets.find((o) => o.id === selectedOutletId) || null;
  }, [outlets, selectedOutletId]);

  const isAllOutlets = selectedOutletId === 'all';

  const value = useMemo(() => ({
    outlets, selectedOutletId, setSelectedOutletId, selectedOutlet, isAllOutlets,
  }), [outlets, selectedOutletId, setSelectedOutletId, selectedOutlet, isAllOutlets]);

  return (
    <AdminOutletContext.Provider value={value}>
      {children}
    </AdminOutletContext.Provider>
  );
}

export function useAdminOutlet() {
  const context = useContext(AdminOutletContext);
  if (!context) throw new Error('useAdminOutlet must be used within AdminOutletProvider');
  return context;
}
