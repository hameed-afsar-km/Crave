'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function QueueWidget() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ahead, setAhead] = useState(8);
  const [wait, setWait] = useState(12);

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
