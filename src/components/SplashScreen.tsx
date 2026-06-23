'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const t = setTimeout(onFinish, 4000);
    return () => clearTimeout(t);
  }, [onFinish]);

  const radius = 72;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7, delay: 3.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#06060A]"
    >
      <div className="relative flex flex-col items-center gap-8">
        {/* Ring glow */}
        <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gold/5 blur-3xl" />

        {/* Ring + center content */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B8960F" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#F5D87A" />
              </linearGradient>
            </defs>
            {/* BG track */}
            <circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="rgba(212,175,55,0.08)"
              strokeWidth="5"
            />
            {/* Progress arc */}
            <motion.circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => setShowLogo(true)}
            />
          </svg>

          {/* Center: pulsing LOADING text → logo */}
          <AnimatePresence mode="wait">
            {!showLogo ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.span
                  className="text-sm sm:text-base font-bold text-gold/70 tracking-[0.2em]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  LOADING
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                key="logo"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.img
                  src="/Logo Transparent.png"
                  alt="Crave"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-24 sm:w-28 h-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-[10px] sm:text-xs font-bold text-gold/50 uppercase tracking-[0.3em]"
        >
          Skip the Queue • Order Smarter
        </motion.p>
      </div>
    </motion.div>
  );
}
