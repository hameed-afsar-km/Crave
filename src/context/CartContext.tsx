'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  selectedOutletId: string;
  selectedOutletName: string;
  setSelectedOutlet: (id: string, name: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [selectedOutletName, setSelectedOutletName] = useState('');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('crave-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch { }
    }
    const savedOutlet = localStorage.getItem('crave-cart-outlet');
    if (savedOutlet) {
      try {
        const parsed = JSON.parse(savedOutlet);
        setSelectedOutletId(parsed.id || '');
        setSelectedOutletName(parsed.name || '');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crave-cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crave-cart-outlet', JSON.stringify({ id: selectedOutletId, name: selectedOutletName }));
    }
  }, [selectedOutletId, selectedOutletName, mounted]);

  const setSelectedOutlet = (id: string, name: string) => {
    setSelectedOutletId(id);
    setSelectedOutletName(name);
  };

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const variantKey = (k: CartItem) => {
        const optPart = k.options?.length ? [...k.options].sort().join('|') : '';
        const addonPart = k.addons?.length ? k.addons.map(a => `${a.name}:${a.price}`).sort().join('|') : '';
        return `${optPart}||${addonPart}`;
      };
      const itemKey = variantKey(item);
      const existing = prev.find(i =>
        i.menuItemId === item.menuItemId && variantKey(i) === itemKey
      );
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.menuItemId && variantKey(i) === itemKey
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setSelectedOutletId('');
    setSelectedOutletName('');
    localStorage.removeItem('crave-cart-outlet');
  };

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(() => ({
    items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal,
    selectedOutletId, selectedOutletName, setSelectedOutlet,
  }), [items, itemCount, subtotal, selectedOutletId, selectedOutletName]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
