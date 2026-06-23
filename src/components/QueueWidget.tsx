'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Users, X, Zap } from 'lucide-react';
import Link from 'next/link';

export default function QueueWidget() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [waitTime, setWaitTime] = useState(18);
  const [activeOrders, setActiveOrders] = useState(24);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(prev => Math.max(5, Math.min(40, prev + (Math.random() > 0.5 ? 1 : -1))));
      setActiveOrders(prev => Math.max(1, Math.min(50, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.92 }}
          transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div className="relative rounded-[24px] overflow-hidden min-w-[220px]">
            {/* Background */}
            <div className="absolute inset-0 bg-[rgba(12,9,5,0.88)] backdrop-blur-2xl border border-gold/18 rounded-[24px]" />
            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08)_0%,transparent_60%)] rounded-[24px]" />
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-[24px] border border-gold/8 pointer-events-none"
            />

            <div className="relative z-10 p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Queue</span>
                </div>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-white/4 border border-white/5 text-center">
                  <Timer className="w-3.5 h-3.5 text-gold mx-auto mb-1.5" />
                  <motion.p
                    key={waitTime}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xl font-black text-white tabular-nums"
                  >
                    {waitTime}
                  </motion.p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Min wait</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/4 border border-white/5 text-center">
                  <Users className="w-3.5 h-3.5 text-gold mx-auto mb-1.5" />
                  <motion.p
                    key={activeOrders}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xl font-black text-white tabular-nums"
                  >
                    {activeOrders}
                  </motion.p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Orders</p>
                </div>
              </div>

              {/* CTA */}
              <Link href="/menu">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-gold to-amber-600 text-white text-[11px] font-black rounded-2xl shadow-lg shadow-gold/12 hover:shadow-gold/28 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Skip The Queue
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
