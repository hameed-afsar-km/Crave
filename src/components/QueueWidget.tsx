'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QueueWidget() {
  const [visible, setVisible] = useState(false);
  const [waitTime, setWaitTime] = useState(18);
  const [activeOrders, setActiveOrders] = useState(24);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(prev => Math.max(5, prev + (Math.random() > 0.5 ? 1 : -1)));
      setActiveOrders(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div className="bg-gray-950/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800 p-5 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live Queue</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                  <Timer className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-white">{waitTime}</p>
                <p className="text-xs text-gray-400">Minutes Wait</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-white">{activeOrders}</p>
                <p className="text-xs text-gray-400">Active Orders</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold py-2.5 rounded-xl"
            >
              Order Now & Skip Queue
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
