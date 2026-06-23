'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ChefHat, Package, MapPin, ArrowLeft, Flame } from 'lucide-react';
import { formatPrice, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';

const statusSteps = ['received', 'preparing', 'ready', 'completed'];

const statusConfig: Record<string, { icon: React.ReactNode; label: string; sub: string }> = {
  received: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Order Received',
    sub: 'We got your order and will start preparing soon.',
  },
  preparing: {
    icon: <ChefHat className="w-5 h-5" />,
    label: 'Being Prepared',
    sub: 'Your food is being freshly prepared right now.',
  },
  ready: {
    icon: <Package className="w-5 h-5" />,
    label: 'Ready for Pickup',
    sub: 'Your order is packed and waiting at the counter!',
  },
  completed: {
    icon: <MapPin className="w-5 h-5" />,
    label: 'Collected',
    sub: 'Enjoy your meal! Hope to see you again soon.',
  },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const [currentStatus, setCurrentStatus] = useState(0);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('crave-last-order');
    if (saved) {
      try { setOrderInfo(JSON.parse(saved)); } catch {}
    }
    const interval = setInterval(() => {
      setCurrentStatus(prev => prev < statusSteps.length - 1 ? prev + 1 : prev);
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
    <div className="min-h-screen bg-[#06060A] pt-28 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(212,175,55,0.03)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        {/* Main tracking card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[32px] bg-[rgba(12,9,5,0.72)] backdrop-blur-xl border border-gold/15 p-7 md:p-10 mb-5 relative overflow-hidden shadow-2xl"
        >
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.07)_0%,transparent_65%)] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-4 h-4 text-gold" />
                <h1 className="text-xl font-black text-white tracking-tight">Order Status</h1>
              </div>
              <p className="text-zinc-600 text-xs font-bold tracking-wider">#{order.orderId}</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/8 rounded-full border border-emerald-500/15"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </div>
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live</span>
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative pl-3">
            {/* Vertical line */}
            <div className="absolute left-[31px] top-3 bottom-3 w-px bg-gradient-to-b from-gold/20 via-gold/10 to-transparent" />

            <div className="space-y-7">
              {statusSteps.map((step, i) => {
                const isDone = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const cfg = statusConfig[step];

                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-5"
                  >
                    {/* Step icon */}
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-500 ${
                        isDone
                          ? 'bg-gradient-to-br from-gold to-amber-600 border-transparent text-white shadow-lg shadow-gold/20'
                          : 'bg-[#0a0908] border-white/8 text-zinc-700'
                      }`}
                    >
                      {cfg.icon}
                      {isCurrent && (
                        <span className="absolute -inset-1 rounded-full border border-gold/30 animate-pulse" />
                      )}
                    </motion.div>

                    {/* Step text */}
                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className={`font-black text-sm tracking-wide transition-colors ${isDone ? 'text-white' : 'text-zinc-600'}`}>
                          {cfg.label}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-gold/10 text-gold text-[9px] font-black rounded-full border border-gold/15 uppercase tracking-widest animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 font-medium transition-colors ${isDone ? 'text-zinc-500' : 'text-zinc-700'}`}>
                        {cfg.sub}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, label: 'Est. Wait', value: `${order.estimatedWaitTime || 18} min` },
            { icon: Clock, label: 'Pickup Time', value: order.pickupTime },
            { icon: Package, label: 'Total', value: formatPrice(order.amount), gold: true },
          ].map(({ icon: Icon, label, value, gold }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="rounded-[20px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5 text-center"
            >
              <Icon className="w-5 h-5 text-gold mx-auto mb-3" />
              <p className={`text-2xl font-black tracking-tight ${gold ? 'text-gradient-gold glow-text-sm' : 'text-white'}`}>
                {value}
              </p>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Back to menu button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-center"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-gold transition-colors"
          >
            <Flame className="w-4 h-4" />
            Order something else
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
