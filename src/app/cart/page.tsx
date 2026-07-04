'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, X, ShoppingBag, ArrowLeft, ArrowRight, Trash2, Store, Ban } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { loadSettings } from '@/lib/store';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const [storeStatus, setStoreStatus] = useState(() => loadSettings());
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const canOrder = storeStatus.storeOpen && storeStatus.acceptingOrders;

  useEffect(() => {
    setStoreStatus(loadSettings());
    const interval = setInterval(() => setStoreStatus(loadSettings()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#06060A] pt-32 md:pt-40 pb-16 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center relative z-10 px-5"
        >
          <div className="relative inline-block mb-7">
            <div className="absolute -inset-5 bg-gold/8 rounded-full blur-2xl animate-pulse" />
            <div className="w-20 h-20 rounded-2xl bg-[rgba(12,10,20,0.7)] border border-white/8 flex items-center justify-center relative">
              <ShoppingBag className="w-9 h-9 text-gold/70" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Cart is Empty</h1>
          <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Looks like you haven&apos;t added anything yet. Start exploring our menu!
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-gold to-amber-600 text-white font-bold rounded-full shadow-lg shadow-gold/12 hover:shadow-gold/25 hover:scale-[1.03] transition-all duration-300"
          >
            Browse Menu
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-32 md:pt-40 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Your Cart
            </h1>
            <p className="text-zinc-500 text-sm mt-1.5">
              {items.length} item{items.length !== 1 ? 's' : ''} ready to order
            </p>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-2 px-5 py-2 border border-red-500/12 text-red-400 bg-red-500/5 hover:bg-red-500/12 hover:border-red-500/25 rounded-full transition-all text-xs font-bold uppercase tracking-wider w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cart
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3.5">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-4 p-4 rounded-[22px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] hover:border-gold/18 transition-all duration-300 group"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-white text-[15px] leading-tight">{item.name}</h3>
                      <p className="text-gold font-black mt-1 text-sm">{formatPrice(item.price)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/3 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-zinc-600 transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.options && item.options.length > 0 && (
                    <p className="text-[11px] text-zinc-600 mt-1 font-semibold">Extras: {item.options.join(', ')}</p>
                  )}

                  <div className="flex items-center justify-between mt-2.5">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-white/8 bg-white/3 flex items-center justify-center hover:border-gold/35 hover:text-gold text-zinc-400 transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-white text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-white/8 bg-white/3 flex items-center justify-center hover:border-gold/35 hover:text-gold text-zinc-400 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-black text-white text-base">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="sticky top-28 rounded-[28px] bg-[rgba(12,9,5,0.72)] backdrop-blur-xl border border-gold/15 p-6 shadow-2xl shadow-black/50"
            >
              <h2 className="text-base font-black text-white mb-6 uppercase tracking-wider">Order Summary</h2>

              <div className="space-y-3.5 mb-5">
                <div className="flex justify-between text-zinc-500 text-sm">
                  <span>Subtotal</span>
                  <span className="font-bold text-zinc-300">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-sm">
                  <span>GST (18%)</span>
                  <span className="font-bold text-zinc-300">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-sm">
                  <span>Delivery</span>
                  <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Pickup Only</span>
                </div>
              </div>

              <div className="divider-gold mb-5" />

              <div className="flex justify-between items-center mb-8">
                <span className="font-black text-white text-base">Total</span>
                <span className="text-2xl font-black text-gradient-gold glow-text-sm">{formatPrice(total)}</span>
              </div>

              {!canOrder ? (
                <div className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-800/50 text-zinc-500 font-black rounded-2xl border border-zinc-700/50 text-sm cursor-not-allowed">
                  {!storeStatus.storeOpen ? <Store className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  {!storeStatus.storeOpen ? 'Store Closed' : 'Orders Paused'}
                </div>
              ) : (
                <Link
                  href="/checkout"
                  className="group flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-black rounded-2xl shadow-lg shadow-gold/12 hover:shadow-gold/28 hover:scale-[1.02] transition-all duration-300 text-sm overflow-hidden relative"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                  <span className="relative">Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              <Link
                href="/menu"
                className="mt-3.5 flex items-center justify-center gap-2 w-full py-2.5 text-zinc-500 font-semibold hover:text-gold transition-colors text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
