'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 9 + 3;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setPhase('done'), 300);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(onFinish, 600);
      return () => clearTimeout(t);
    }
  }, [phase, onFinish]);

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#06060A] overflow-hidden"
        >
          {/* Background radial layers */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(212,175,55,0.07)_0%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_50%_50%,rgba(212,175,55,0.05)_0%,transparent_55%)]" />

          {/* Rotating ring */}
          <div className="absolute w-[340px] h-[340px] rounded-full border border-gold/5 animate-spin-slow" />
          <div
            className="absolute w-[280px] h-[280px] rounded-full border border-dashed border-gold/8"
            style={{ animation: 'spin-slow 20s linear infinite reverse' }}
          />

          {/* Gold particles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-gold/40"
              style={{
                left: `${10 + i * 9}%`,
                top: `${20 + (i % 5) * 15}%`,
              }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.5, 0.8] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {/* Logo with glow ring */}
            <div className="relative">
              <motion.div
                className="absolute -inset-6 rounded-full"
                animate={{
                  background: [
                    'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
                    'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)',
                    'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.img
                src="/Logo Transparent.png"
                alt="Crave"
                className="h-24 md:h-32 w-auto relative z-10"
                animate={{
                  filter: [
                    'drop-shadow(0 0 10px rgba(212,175,55,0.2))',
                    'drop-shadow(0 0 28px rgba(212,175,55,0.45))',
                    'drop-shadow(0 0 10px rgba(212,175,55,0.2))',
                  ],
                  scale: [1, 1.015, 1],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Tagline */}
            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, letterSpacing: '0.22em' }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-xs md:text-sm font-bold text-gold/75 uppercase tracking-[0.22em]"
              >
                Skip the Queue • Order Smarter
              </motion.p>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-52 space-y-2"
            >
              <div className="relative h-[3px] bg-white/5 rounded-full overflow-hidden">
                {/* Track shimmer */}
                <div className="absolute inset-0 shimmer-gold" />
                {/* Progress fill */}
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-light via-gold to-amber-600 relative"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
                </motion.div>
              </div>
              <p className="text-center text-zinc-600 text-[10px] font-mono tracking-widest">
                {Math.round(Math.min(progress, 100))}%
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
