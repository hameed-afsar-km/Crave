'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ShoppingCart, ArrowRight, Plus } from 'lucide-react';
import { useAddToCartPopup } from '@/context/AddToCartPopupContext';
import { useCart } from '@/context/CartContext';
import { subscribeMenuItems } from '@/lib/firestore-service';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/types';

export default function AddToCartPopup() {
  const { isOpen, popupItem, close } = useAddToCartPopup();
  const { addItem, items: cartItems } = useCart();
  const [allItems, setAllItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const unsub = subscribeMenuItems((items) => setAllItems(items));
    return unsub;
  }, []);

  const recommendations = popupItem?.category
    ? allItems
        .filter(i => i.category === popupItem.category && i.available && i.name !== popupItem.name)
        .slice(0, 3)
    : allItems.filter(i => i.available).slice(0, 3);

  const handleQuickAdd = useCallback((item: MenuItem) => {
    addItem({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
  }, [addItem]);

  return (
    <AnimatePresence>
      {isOpen && popupItem && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-[95] bg-[#12121A] border border-zinc-800/60 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Added item confirmation */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Added to Cart</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                  <Image
                    src={popupItem.image}
                    alt={popupItem.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-sm truncate">{popupItem.name}</h3>
                  <p className="text-gold font-black text-sm mt-0.5">{formatPrice(popupItem.price)}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="px-6 pb-4">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">You might also like</p>
                <div className="space-y-2">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] transition-all">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/5">
                        <Image
                          src={rec.image}
                          alt={rec.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover aspect-square"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{rec.name}</p>
                        <p className="text-[11px] font-black text-gold">{formatPrice(rec.price)}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuickAdd(rec)}
                        className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-all duration-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="p-6 pt-2 flex gap-3">
              <button
                onClick={close}
                className="flex-1 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.06] hover:text-white transition-all"
              >
                Continue Shopping
              </button>
              <Link
                href="/cart"
                onClick={close}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-gold/10"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Go to Cart
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
