'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Store, Ban } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { loadSettings } from '@/lib/store';

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const [storeStatus, setStoreStatus] = useState(() => loadSettings());

  useEffect(() => {
    setStoreStatus(loadSettings());
    const interval = setInterval(() => setStoreStatus(loadSettings()), 10000);
    return () => clearInterval(interval);
  }, [open]);

  const canOrder = storeStatus.storeOpen && storeStatus.acceptingOrders;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[70]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[rgba(10,9,16,0.85)] backdrop-blur-2xl border-l border-white/[0.08] z-[80] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06] bg-black/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold glow-text-sm" />
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Your Cart</h2>
                <span className="text-xs font-black text-gold/60 uppercase tracking-wider">({items.length})</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl border border-white/5 bg-white/3 hover:bg-white/6 hover:border-gold/22 text-zinc-400 hover:text-gold transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 relative">
                  <div className="w-20 h-20 rounded-full bg-white/2 border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                    <ShoppingBag className="w-8 h-8 text-zinc-600 animate-float" />
                  </div>
                  <p className="text-white font-black text-lg uppercase tracking-wider">Your cart is empty</p>
                  <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest font-semibold max-w-[200px]">Add some delicious items to get started!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-4 p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white tracking-wide truncate">{item.name}</h4>
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.addons.map((addon, idx) => (
                              <p key={idx} className="text-[10px] text-zinc-500">
                                + {addon.name} ({formatPrice(addon.price)})
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-gold font-black text-sm mt-1">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border border-white/10 bg-white/2 flex items-center justify-center hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-colors"
                          >
                            <Minus className="w-3 h-3 text-zinc-400" />
                          </button>
                          <span className="font-bold text-sm w-5 text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border border-white/10 bg-white/2 flex items-center justify-center hover:bg-gold/10 hover:border-gold/30 hover:text-gold transition-colors"
                          >
                            <Plus className="w-3 h-3 text-zinc-400" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/[0.06] bg-black/20 p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-wider">Subtotal</span>
                  <span className="text-xl font-black text-gradient-gold tracking-tight">{formatPrice(subtotal)}</span>
                </div>
                {!canOrder ? (
                  <div className="w-full py-4 bg-zinc-800/50 text-zinc-500 font-black uppercase tracking-widest text-xs rounded-full text-center cursor-not-allowed border border-zinc-700/50 flex items-center justify-center gap-2">
                    {!storeStatus.storeOpen ? <Store className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                    {!storeStatus.storeOpen ? 'Store Closed' : 'Orders Paused'}
                  </div>
                ) : (
                  <Link
                    href="/checkout"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-full shadow-lg shadow-gold/10 hover:shadow-gold/25 transition-all hover:brightness-110 duration-300"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
