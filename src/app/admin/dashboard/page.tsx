'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag, IndianRupee, Clock, CheckCircle, CookingPot,
  TrendingUp, TrendingDown, Package, Users, ArrowRight,
  Zap, ChevronRight, AlertTriangle, Phone, Database, Store
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { seedSampleData, isSeeded, getStoredOrders } from '@/lib/seed-data';
import { loadSettings, saveSettings } from '@/lib/store';

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
  return <span ref={ref} className="text-3xl font-black text-white tabular-nums tracking-tight">{prefix}{count}{suffix}</span>;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 72;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" />
    </svg>
  );
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState(loadSettings());
  const [seeded, setSeeded] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setSeeded(isSeeded());
    const stored = getStoredOrders();
    if (stored) setOrders(stored);
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const toggleStore = () => {
    const next = { ...settings, storeOpen: !settings.storeOpen };
    setSettings(next);
    saveSettings(next);
  };

  const toggleAccepting = () => {
    const next = { ...settings, acceptingOrders: !settings.acceptingOrders };
    setSettings(next);
    saveSettings(next);
  };

  const handleSeedData = () => {
    seedSampleData();
    setSeeded(true);
    const stored = getStoredOrders();
    if (stored) setOrders(stored);
  };

  /* ── Compute KPIs from real data ── */
  const todayStr = now.toISOString().slice(0, 10);
  const todayOrders = orders.filter((o: any) => o.createdAt && o.createdAt.includes(todayStr) || true);
  const ordersToday = orders.length;
  const revenueToday = orders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const pendingOrders = orders.filter((o: any) => o.status !== 'completed').length;
  const preparingCount = orders.filter((o: any) => o.status === 'preparing').length;
  const readyCount = orders.filter((o: any) => o.status === 'ready').length;
  const receivedCount = orders.filter((o: any) => o.status === 'received').length;
  const completedToday = orders.filter((o: any) => o.status === 'completed').length;
  const avgOrderValue = orders.length ? Math.round(revenueToday / orders.length) : 0;
  const queueLength = pendingOrders;

  /* Best seller (most ordered item name) */
  const itemCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    (o.items || []).forEach((item: any) => {
      const name = item.name || item.menuItemId;
      itemCounts[name] = (itemCounts[name] || 0) + (item.qty || 1);
    });
  });
  const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a);
  const bestSeller = sortedItems.length ? sortedItems[0][0] : 'N/A';

  /* Peak hour */
  const hourCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    const h = o.pickupTime ? o.pickupTime.split(':')[0] : '12';
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a);
  const peakHourStr = peakHour.length ? `${peakHour[0][0]}:00` : 'N/A';

  /* Recent activity */
  const recentActivity = orders
    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 6)
    .map((o: any) => {
      const statusLabel: Record<string, string> = { received: 'New order', preparing: 'Started preparing', ready: 'Marked ready', completed: 'Collected' };
      return { action: `${statusLabel[o.status] || 'Updated'} #${o.id}`, customer: o.customer, status: o.status, time: o.createdAt || '' };
    });

  /* Wait time estimate */
  const estimatedWait = preparingCount > 0 ? Math.round(preparingCount * settings.averagePrepTime / Math.max(1, Math.ceil(preparingCount / 2))) : 0;

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

      {/* Header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <div className={`w-2 h-2 rounded-full ${settings.storeOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Dashboard</h1>
              </div>
              <p className="text-zinc-500 text-xs font-semibold">
                {now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Seed data */}
              <button
                onClick={handleSeedData}
                disabled={seeded}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  seeded
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                    : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/18 hover:border-gold/30'
                }`}
              >
                <Database className="w-3 h-3" />
                {seeded ? 'Seeded ✓' : 'Seed Data'}
              </button>
              {/* Accepting orders toggle */}
              <button
                onClick={toggleAccepting}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  settings.acceptingOrders
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {settings.acceptingOrders ? 'Accepting' : 'Paused'}
              </button>
              {/* Store toggle */}
              <button
                onClick={toggleStore}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  settings.storeOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                <Store className="w-3 h-3" />
                {settings.storeOpen ? 'Open' : 'Closed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 relative z-10 space-y-8">

        {/* ════════════════════════════════════════ */}
        {/* SECTION 1 — TODAY OVERVIEW              */}
        {/* ════════════════════════════════════════ */}
        <div>
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Today Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Orders Today', value: ordersToday, icon: ShoppingBag, color: 'from-gold to-amber-600', prefix: '', trend: ordersToday > 0 ? `${Math.round(ordersToday)}` : '0', up: true },
              { label: 'Revenue Today', value: revenueToday, icon: IndianRupee, color: 'from-emerald-400 to-green-500', prefix: '₹', trend: revenueToday > 0 ? `₹${revenueToday}` : '₹0', up: true },
              { label: 'Pending Orders', value: pendingOrders, icon: Clock, color: 'from-amber-400 to-orange-500', prefix: '', trend: `${pendingOrders} active`, up: false },
              { label: 'Completed Today', value: completedToday, icon: CheckCircle, color: 'from-blue-400 to-violet-500', prefix: '', trend: completedToday > 0 ? `${completedToday}` : '0', up: true },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-[20px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                    <card.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className={`text-[10px] font-black ${card.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {card.trend}
                  </span>
                </div>
                <AnimatedCounter value={card.value} prefix={card.prefix} />
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1.5">{card.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 2 — LIVE OPERATIONS             */}
        {/* ════════════════════════════════════════ */}
        <div>
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Live Operations</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Queue Length', value: queueLength, icon: Users, color: 'from-blue-400 to-violet-500', sub: `${preparingCount} being prepared` },
              { label: 'Est. Wait Time', value: estimatedWait, icon: Clock, color: 'from-amber-400 to-orange-500', suffix: ' min', sub: `Avg prep ${settings.averagePrepTime} min` },
              { label: 'Preparing', value: preparingCount, icon: CookingPot, color: 'from-gold to-amber-500', sub: `${receivedCount} received` },
              { label: 'Ready for Pickup', value: readyCount, icon: Package, color: 'from-emerald-400 to-green-500', sub: readyCount > 0 ? `${readyCount} waiting` : 'None' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="rounded-[20px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5 hover:border-white/[0.1] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md mb-3`}>
                  <card.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white tabular-nums tracking-tight">{card.value}</span>
                  {card.suffix && <span className="text-lg font-black text-zinc-500">{card.suffix}</span>}
                </div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">{card.label}</p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Kitchen link */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <Link
              href="/admin/kitchen"
              className="flex items-center justify-between gap-3 px-5 py-4 rounded-[20px] bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/15 hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <CookingPot className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-white">Open Kitchen Display</p>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{preparingCount + receivedCount} orders in progress</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400/50 group-hover:text-amber-400 transition-colors" />
            </Link>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 3 — QUICK PERFORMANCE           */}
        {/* ════════════════════════════════════════ */}
        <div>
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Quick Performance</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Best Seller', value: bestSeller, icon: TrendingUp, color: 'from-gold to-amber-500', sub: sortedItems.length ? `${sortedItems[0][1]} orders` : '' },
              { label: 'Peak Hour', value: peakHourStr, icon: Zap, color: 'from-amber-400 to-orange-500', sub: 'Busiest time today' },
              { label: 'Avg Order Value', value: `₹${avgOrderValue}`, icon: IndianRupee, color: 'from-emerald-400 to-green-500', sub: 'Per order' },
              { label: 'Completion Rate', value: orders.length ? `${Math.round(completedToday / orders.length * 100)}%` : '0%', icon: CheckCircle, color: 'from-blue-400 to-violet-500', sub: `${completedToday} of ${orders.length}` },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="rounded-[20px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                    <card.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{card.label}</p>
                </div>
                <p className="text-xl font-black text-white truncate">{card.value}</p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 4 — RECENT ACTIVITY             */}
        {/* ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Recent Activity</h2>
              <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Latest order updates</p>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest bg-gold/10 text-gold border border-gold/15 rounded-xl hover:bg-gold/18 transition-all">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentActivity.length === 0 && (
              <p className="text-center py-8 text-zinc-600 font-semibold text-sm">No activity yet. Seed sample data to get started.</p>
            )}
            {recentActivity.map((a: any, i: number) => {
              const statusColors: Record<string, string> = {
                received: 'bg-blue-400',
                preparing: 'bg-amber-400',
                ready: 'bg-emerald-400',
                completed: 'bg-zinc-600',
              };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.32 + i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusColors[a.status] || 'bg-zinc-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 font-semibold leading-tight truncate">{a.action}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{a.customer} · {a.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ════════════════════════════════════════ */}
        {/* SECTION 5 — ORDER CONTROL QUICK ACTIONS */}
        {/* ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <ShoppingBag className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Online Order Control</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
              <div>
                <p className="text-sm font-bold text-white">Accepting Orders</p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                  {settings.acceptingOrders ? 'Customers can place orders' : 'Online ordering is paused'}
                </p>
              </div>
              <button
                onClick={toggleAccepting}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings.acceptingOrders ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${settings.acceptingOrders ? 'left-6.5 bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
              <div>
                <p className="text-sm font-bold text-white">Store Status</p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                  {settings.storeOpen ? 'Store is open for business' : 'Store is closed'}
                </p>
              </div>
              <button
                onClick={toggleStore}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings.storeOpen ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${settings.storeOpen ? 'left-6.5 bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Daily Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <IndianRupee className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Daily Summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Today's Revenue", value: `₹${revenueToday}`, sub: `${ordersToday} orders` },
              { label: 'Avg Order Value', value: `₹${avgOrderValue}`, sub: 'Per order' },
              { label: 'Best Seller', value: bestSeller, sub: `${sortedItems.length ? sortedItems[0][1] : 0} orders` },
              { label: 'Peak Hour', value: peakHourStr, sub: 'Busiest time' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-black/30 border border-white/5">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-base font-black text-white truncate">{item.value}</p>
                <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
