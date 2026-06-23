'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(onFinish, 700);
      return () => clearTimeout(t);
    }
  }, [visible, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#06060A]"
        >
          <motion.img
            src="/Logo Transparent.png"
            alt="Crave"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-[140px] sm:w-[160px] md:w-[180px] h-auto"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
