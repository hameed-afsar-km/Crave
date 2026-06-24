'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFinish, 4000);
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.7, delay: 3.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#06060A]"
    >
      {/* Background glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute w-96 h-96 rounded-full bg-gold/15 blur-[120px]"
      />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute w-56 h-56 rounded-full bg-gold/20 blur-[60px]"
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Gold line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-px w-32 sm:w-40 bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />

        {/* Logo text */}
        <motion.div
          initial={{ y: 20, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <h1 className="font-steelfish text-5xl sm:text-7xl md:text-8xl text-gradient-gold-bright glow-text">
              Crave
            </h1>
          </motion.div>
        </motion.div>

        {/* Gold line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-px w-32 sm:w-40 bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />


      </div>
    </motion.div>
  );
}
