'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag, IndianRupee, Clock, CheckCircle,
  TrendingUp, Package, Users, ArrowRight, BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const steps = 32;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);

  return (
    <span ref={ref} className="text-3xl font-black text-white tabular-nums tracking-tight">
      {prefix}{count}{suffix}
    </span>
  );
}

const statsCards = [
  { label: 'Orders Today', value: 48, icon: ShoppingBag, color: 'from-gold to-amber-600', glow: 'rgba(212,175,55,0.2)', prefix: '' },
  { label: 'Revenue Today', value: 12450, icon: IndianRupee, color: 'from-emerald-400 to-green-500', glow: 'rgba(52,211,153,0.2)', prefix: '₹' },
  { label: 'Pending Orders', value: 12, icon: Clock, color: 'from-amber-400 to-orange-500', glow: 'rgba(251,191,36,0.2)', prefix: '' },
  { label: 'Completed Today', value: 36, icon: CheckCircle, color: 'from-blue-400 to-violet-500', glow: 'rgba(96,165,250,0.2)', prefix: '' },
];

const recentOrders = [
  { id: '#CRV-048', customer: 'Rahul K.', items: 3, amount: 450, status: 'preparing' },
  { id: '#CRV-047', customer: 'Priya S.', items: 2, amount: 330, status: 'ready' },
  { id: '#CRV-046', customer: 'Amit P.', items: 4, amount: 680, status: 'completed' },
  { id: '#CRV-045', customer: 'Divya R.', items: 1, amount: 180, status: 'received' },
];

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  preparing: { label: 'Preparing', color: 'text-amber-400', dot: 'bg-amber-400' },
  ready: { label: 'Ready', color: 'text-blue-400', dot: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  received: { label: 'Received', color: 'text-gold', dot: 'bg-gold' },
};

const quickActions = [
  { href: '/admin/orders', icon: Package, label: 'Manage Orders', color: 'text-gold', hoverBorder: 'hover:border-gold/25', hoverBg: 'hover:bg-gold/4' },
  { href: '/admin/menu', icon: ShoppingBag, label: 'Edit Menu', color: 'text-gold', hoverBorder: 'hover:border-gold/25', hoverBg: 'hover:bg-gold/4' },
  { href: '/', icon: TrendingUp, label: 'View Live Site', color: 'text-emerald-400', hoverBorder: 'hover:border-emerald-500/25', hoverBg: 'hover:bg-emerald-500/4' },
  { href: '/menu', icon: Users, label: 'Client Order', color: 'text-blue-400', hoverBorder: 'hover:border-blue-500/25', hoverBg: 'hover:bg-blue-500/4' },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-zinc-500 text-sm mb-6">Administrator credentials required.</p>
          <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-gold to-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-full">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Page header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <BarChart3 className="w-5 h-5 text-gold" />
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Dashboard</h1>
              </div>
              <p className="text-zinc-500 text-sm">Welcome back, {user?.name || 'Administrator'}</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { href: '/admin/orders', label: 'Orders' },
                { href: '/admin/menu', label: 'Menu' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-gold border border-white/6 hover:border-gold/22 bg-white/3 rounded-xl transition-all">
                  {link.label}
                </Link>
              ))}
              <Link href="/" className="px-4 py-2 text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-gold to-amber-600 text-white rounded-xl shadow-md shadow-gold/10 hover:shadow-gold/22 hover:scale-[1.02] transition-all">
                View Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 relative z-10">
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statsCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-[22px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] hover:border-white/[0.1] p-6 transition-all duration-300 overflow-hidden group"
            >
              <div
                className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl"
                style={{ background: card.glow }}
              />
              <div className="flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <AnimatedCounter value={card.value} prefix={card.prefix} />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Lower panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent orders */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Recent Orders</h2>
              <Link href="/admin/orders" className="text-[11px] font-black text-gold/70 hover:text-gold transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order, i) => {
                const s = statusConfig[order.status];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex items-center justify-between p-4 bg-black/30 border border-white/4 rounded-2xl hover:border-gold/18 transition-all duration-300"
                  >
                    <div>
                      <p className="font-black text-sm text-white">{order.id}</p>
                      <p className="text-xs text-zinc-600 mt-0.5 font-semibold">{order.customer} · {order.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-zinc-200">₹{order.amount}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider flex items-center justify-end gap-1 mt-1 ${s.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.5 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {quickActions.map((action, i) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.28 + i * 0.06 }}
                >
                  <Link
                    href={action.href}
                    className={`group p-5 bg-black/30 border border-white/4 ${action.hoverBorder} ${action.hoverBg} rounded-2xl flex flex-col items-center text-center transition-all duration-300 shadow-sm`}
                  >
                    <action.icon className={`w-6 h-6 ${action.color} mb-3.5 group-hover:scale-110 transition-transform`} />
                    <span className={`text-[11px] font-black uppercase tracking-wider text-zinc-400 ${action.color.replace('text-', 'group-hover:text-')} transition-colors`}>
                      {action.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
