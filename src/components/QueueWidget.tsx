'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronRight } from 'lucide-react';
import { subscribeOrder } from '@/lib/firestore-service';

interface OrderData {
  id: string;
  items: { name: string; qty: number; price: number }[];
  amount: number;
  pickupTime: string;
  status: string;
  createdAt: string;
}

function getTimeLeft(pickupTime: string): string {
  const now = new Date();
  const [hours, minutes] = pickupTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '';
  const pickup = new Date(now);
  pickup.setHours(hours, minutes, 0, 0);
  const diffMs = pickup.getTime() - now.getTime();
  if (diffMs <= 0) return 'Ready for pickup';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hrs}h ${mins}m`;
}

function getStatusDisplay(status: string, pickupTime: string): { label: string; color: string } {
  if (status === 'ready') return { label: 'Ready for Pickup!', color: 'text-green-400' };
  if (status === 'cancelled') return { label: 'Cancelled', color: 'text-red-400' };
  const timeLeft = getTimeLeft(pickupTime);
  if (timeLeft === 'Ready for pickup') return { label: 'Ready for pickup', color: 'text-green-400' };
  if (timeLeft) return { label: `${timeLeft} until pickup`, color: 'text-gold' };
  return { label: 'Pickup soon', color: 'text-gold' };
}

export default function QueueWidget() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ahead, setAhead] = useState(8);
  const [wait, setWait] = useState(12);
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [orderDismissed, setOrderDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAhead(prev => Math.max(1, Math.min(20, prev + (Math.random() > 0.6 ? -1 : 1))));
      setWait(prev => Math.max(3, Math.min(35, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('crave-last-order');
    if (raw) {
      try {
        const order = JSON.parse(raw);
        if (order.id && order.status && !['completed', 'cancelled'].includes(order.status)) {
          const unsub = subscribeOrder(order.id, (updatedOrder) => {
            if (updatedOrder) {
              const mapped: OrderData = {
                id: updatedOrder.id,
                items: (updatedOrder.items || []).map((i: any) => ({
                  name: i.name || '',
                  qty: i.qty || i.quantity || 0,
                  price: i.price || 0,
                })),
                amount: updatedOrder.amount,
                pickupTime: updatedOrder.pickupTime,
                status: updatedOrder.status,
                createdAt: typeof updatedOrder.createdAt === 'string' ? updatedOrder.createdAt : new Date().toISOString(),
              };
              setActiveOrder(mapped);
              if (['completed', 'cancelled'].includes(updatedOrder.status)) {
                setTimeout(() => setActiveOrder(null), 5000);
              }
            } else {
              setActiveOrder(null);
            }
          });
          return unsub;
        }
      } catch { /* ignore */ }
    }
    setActiveOrder(null);
  }, []);

  const hasActiveOrder = activeOrder && !orderDismissed;

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 5 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          {hasActiveOrder ? (
            <div className="relative rounded-2xl bg-[rgba(12,9,5,0.88)] backdrop-blur-2xl border border-gold/18 px-5 py-4 shadow-2xl shadow-black/50 min-w-[260px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/18">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                    </span>
                    <span className="text-[9px] font-black text-gold uppercase tracking-[0.15em]">Active</span>
                  </div>
                </div>
                <button
                  onClick={() => setOrderDismissed(true)}
                  className="text-zinc-700 hover:text-zinc-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Time left / status */}
              <div className="mb-2">
                <span className={`text-xl font-black ${getStatusDisplay(activeOrder.status, activeOrder.pickupTime).color}`}>
                  {getStatusDisplay(activeOrder.status, activeOrder.pickupTime).label}
                </span>
              </div>

              {/* Order summary */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <span className="font-semibold text-zinc-400">{activeOrder.items.length} item{activeOrder.items.length !== 1 ? 's' : ''}</span>
                <span className="text-zinc-700">|</span>
                <span className="font-semibold text-zinc-400">₹{activeOrder.amount?.toFixed(2)}</span>
                <span className="text-zinc-700">|</span>
                <span className="font-mono text-zinc-500">#{activeOrder.id?.slice(0, 7)}</span>
              </div>

              {/* Actions */}
              <Link
                href="/orders"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gold/15 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-wider hover:bg-gold/25 transition-all"
                onClick={() => setOrderDismissed(true)}
              >
                View Orders
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="relative rounded-full bg-[rgba(12,9,5,0.85)] backdrop-blur-2xl border border-white/6 px-4 py-2 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-4">
                {/* LIVE badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/15">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                  </span>
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.15em]">Live</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      key={ahead}
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-white font-black tabular-nums"
                    >
                      {ahead}
                    </motion.span>
                    <span className="text-zinc-500 text-xs">ahead</span>
                  </div>

                  <span className="text-zinc-700 text-[10px]">|</span>

                  <div className="flex items-center gap-1.5">
                    <motion.span
                      key={wait}
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-white font-black tabular-nums"
                    >
                      {wait}
                    </motion.span>
                    <span className="text-zinc-500 text-xs">min</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/menu"
                  className="px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-wider hover:bg-gold/25 transition-all"
                >
                  Order
                </Link>

                {/* Dismiss */}
                <button
                  onClick={() => setDismissed(true)}
                  className="text-zinc-700 hover:text-zinc-400 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
