'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartItem, MenuItem } from '@/types';

interface PopupItem {
  name: string;
  image: string;
  price: number;
  category?: string;
}

interface AddToCartPopupContextType {
  showPopup: (item: PopupItem) => void;
  isOpen: boolean;
  popupItem: PopupItem | null;
  close: () => void;
}

const AddToCartPopupContext = createContext<AddToCartPopupContextType | undefined>(undefined);

export function AddToCartPopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupItem, setPopupItem] = useState<PopupItem | null>(null);

  const showPopup = useCallback((item: PopupItem) => {
    setPopupItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPopupItem(null);
  }, []);

  return (
    <AddToCartPopupContext.Provider value={{ showPopup, isOpen, popupItem, close }}>
      {children}
    </AddToCartPopupContext.Provider>
  );
}

export function useAddToCartPopup() {
  const context = useContext(AddToCartPopupContext);
  if (!context) throw new Error('useAddToCartPopup must be used within AddToCartPopupProvider');
  return context;
}
