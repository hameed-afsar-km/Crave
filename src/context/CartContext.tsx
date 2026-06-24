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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('crave-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('crave-cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const optionsKey = (k: CartItem) => k.options?.length ? [...k.options].sort().join('|') : '';
      const itemKey = optionsKey(item);
      const existing = prev.find(i =>
        i.menuItemId === item.menuItemId && optionsKey(i) === itemKey
      );
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.menuItemId && optionsKey(i) === itemKey
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

  const clearCart = () => setItems([]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(() => ({
    items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal,
  }), [items, itemCount, subtotal]);

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
