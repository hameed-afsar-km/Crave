'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ChefHat, Package, MapPin, ArrowLeft } from 'lucide-react';
import { formatPrice, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';

const statusSteps = ['received', 'preparing', 'ready', 'completed'];

const statusIcons: Record<string, React.ReactNode> = {
  received: <CheckCircle className="w-6 h-6" />,
  preparing: <ChefHat className="w-6 h-6" />,
  ready: <Package className="w-6 h-6" />,
  completed: <MapPin className="w-6 h-6" />,
};

export default function OrderTrackingPage() {
  const params = useParams();
  const [currentStatus, setCurrentStatus] = useState(0);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('crave-last-order');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setOrderInfo(data);
      } catch {}
    }

    const interval = setInterval(() => {
      setCurrentStatus(prev => {
        if (prev < statusSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const order = orderInfo || {
    orderId: params.id,
    status: 'received',
    items: [],
    amount: 0,
    pickupTime: '--:--',
    estimatedWaitTime: 18,
    customerName: 'Customer',
  };

  const currentStepIndex = statusSteps.indexOf(order.status || 'received');

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-950 rounded-3xl p-8 border border-gray-800 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Order Status</h1>
              <p className="text-gray-400 text-sm mt-1">Order #{order.orderId}</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-semibold">Live</span>
            </motion.div>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-800" />
            <div className="space-y-8 relative">
              {statusSteps.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <motion.div
                    animate={
                      i <= currentStepIndex
                        ? { scale: [1, 1.2, 1] }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                      i <= currentStepIndex
                        ? 'bg-gradient-to-r from-gold to-amber-600 text-white shadow-lg shadow-gold/20'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {statusIcons[step]}
                  </motion.div>
                  <div className="flex-1 pt-1">
                    <h3 className={`font-semibold ${
                      i <= currentStepIndex ? 'text-white' : 'text-gray-500'
                    }`}>
                      {getStatusLabel(step)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {i === currentStepIndex && i < statusSteps.length - 1
                        ? 'In progress...'
                        : i < currentStepIndex
                        ? 'Completed'
                        : 'Pending'}
                    </p>
                  </div>
                  {i <= currentStepIndex && i < statusSteps.length - 1 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, delay: i * 0.5 }}
                      className="hidden md:block h-0.5 bg-gradient-to-r from-gold to-amber-600 mt-5"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-950 rounded-2xl p-5 border border-gray-800 text-center"
          >
            <Clock className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{order.estimatedWaitTime || 18}m</p>
            <p className="text-xs text-gray-400">Est. Wait Time</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gray-950 rounded-2xl p-5 border border-gray-800 text-center"
          >
            <Clock className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{order.pickupTime}</p>
            <p className="text-xs text-gray-400">Pickup Time</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-950 rounded-2xl p-5 border border-gray-800 text-center"
          >
            <Package className="w-6 h-6 text-gold mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatPrice(order.amount)}</p>
            <p className="text-xs text-gray-400">Total</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
