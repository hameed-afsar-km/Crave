'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function QueueWidget() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState(8);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => Math.max(1, Math.min(20, prev + (Math.random() > 0.6 ? -1 : 1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-40 hidden sm:block"
        >
          <div className="relative rounded-l-xl overflow-hidden">
            <div className="absolute inset-0 bg-[rgba(12,9,5,0.92)] backdrop-blur-xl border-y border-l border-white/8 rounded-l-xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(212,175,55,0.06)_0%,transparent_70%)]" />

            <div className="relative z-10 flex flex-col items-center px-3 py-5 gap-3">
              {/* Live dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>

              {/* Count */}
              <div className="text-center">
                <motion.span
                  key={position}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-black text-white tabular-nums block leading-none"
                >
                  {position}
                </motion.span>
                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.15em] mt-1 block">Ahead</span>
              </div>

              {/* Divider */}
              <div className="w-5 h-px bg-white/6" />

              {/* CTA */}
              <Link
                href="/menu"
                className="text-[9px] font-black text-gold uppercase tracking-widest hover:text-gold-light transition-colors [writing-mode:vertical-lr] py-1"
              >
                Order
              </Link>

              {/* Dismiss */}
              <button
                onClick={() => setDismissed(true)}
                className="text-zinc-700 hover:text-zinc-400 transition-colors mt-1"
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
