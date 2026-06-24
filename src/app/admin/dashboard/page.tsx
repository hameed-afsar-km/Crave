'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag, IndianRupee, Clock, CheckCircle, CookingPot,
  TrendingUp, Zap, ArrowRight, ChevronRight, Package,
  Users, Database, AlertTriangle, BarChart3, ListOrdered,
  Play, Hand, Timer, Store
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { seedSampleData, isSeeded, getStoredOrders } from '@/lib/seed-data';
import { loadSettings, saveSettings } from '@/lib/store';

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, className = '' }: { value: number; prefix?: string; suffix?: string; decimals?: number; className?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(decimals ? Math.round(current * 10) / 10 : Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView, decimals]);
  return <span ref={ref} className={className}>{prefix}{decimals ? count.toFixed(1) : count}{suffix}</span>;
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data) || 1;
  const w = 64; const h = 20;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v / max) * (h - 4)) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 opacity-40">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState(loadSettings());
  const [seeded, setSeeded] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSeeded(isSeeded());
    const stored = getStoredOrders();
    if (stored) setOrders(stored);
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleStore = () => {
    const next = { ...settings, storeOpen: !settings.storeOpen };
    setSettings(next); saveSettings(next);
  };

  const toggleAccepting = () => {
    const next = { ...settings, acceptingOrders: !settings.acceptingOrders };
    setSettings(next); saveSettings(next);
  };

  const handleSeedData = () => {
    seedSampleData(); setSeeded(true);
    const stored = getStoredOrders();
    if (stored) setOrders(stored);
  };

  const handleClearData = () => {
    ['crave-orders', 'crave-last-order', 'crave-menu-items', 'crave-seeded'].forEach(k => localStorage.removeItem(k));
    setSeeded(false); setOrders([]); setConfirmClear(false);
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const pendingOrders = orders.filter((o: any) => o.status !== 'completed').length;
  const received = orders.filter((o: any) => o.status === 'received').length;
  const preparing = orders.filter((o: any) => o.status === 'preparing').length;
  const ready = orders.filter((o: any) => o.status === 'ready').length;
  const completed = orders.filter((o: any) => o.status === 'completed').length;
  const avgValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const estimatedWait = received > 0 ? Math.round(received * settings.averagePrepTime / Math.max(1, Math.ceil(received / 2))) : 0;

  const itemCounts: Record<string, number> = {};
  orders.forEach((o: any) => (o.items || []).forEach((it: any) => {
    const name = it.name || it.menuItemId;
    itemCounts[name] = (itemCounts[name] || 0) + (it.qty || 1);
  }));
  const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a);
  const bestSeller = sortedItems.length ? sortedItems[0][0] : 'N/A';
  const bestCount = sortedItems.length ? sortedItems[0][1] : 0;

  const hourCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    const h = o.pickupTime ? o.pickupTime.split(':')[0] : '12';
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakEntry = Object.entries(hourCounts).sort(([, a], [, b]) => b - a);
  const peakHour = peakEntry.length ? `${peakEntry[0][0]}:00` : 'N/A';

  const recentOrders = [...orders].sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);

  const sparkData = orders.length ? Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    return orders.filter((o: any) => o.createdAt?.includes(ds)).length;
  }) : [];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-zinc-500 text-sm mb-6">Administrator credentials required.</p>
          <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-gold to-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-full">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pb-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* ── Header ── */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Dashboard</h1>
              <p className="text-[11px] text-zinc-600 font-semibold mt-0.5">
                {now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSeedData} disabled={seeded}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  seeded ? 'bg-emerald-500/8 text-emerald-400/50 border-emerald-500/10 cursor-default' : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                <Database className="w-3 h-3" />{seeded ? 'Seeded' : 'Seed'}
              </button>
              {confirmClear ? (
                <div className="flex items-center gap-1">
                  <button onClick={handleClearData} className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25 transition-all">Confirm</button>
                  <button onClick={() => setConfirmClear(false)} className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/6 text-zinc-500 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} className="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/6 text-zinc-500 hover:text-rose-400 hover:border-rose-500/15 hover:bg-rose-500/6 transition-all">Clear</button>
              )}
            </div>
          </div>

          {/* ═══ HERO METRICS ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Revenue', value: totalRevenue, prefix: '₹', icon: IndianRupee, color: 'from-emerald-400 to-green-500', spark: true },
              { label: 'Orders', value: totalOrders, prefix: '', icon: ShoppingBag, color: 'from-gold to-amber-600', spark: true },
              { label: 'Pending', value: pendingOrders, prefix: '', icon: Clock, color: 'from-amber-400 to-orange-500', urgent: pendingOrders > 0, sub: `${preparing} preparing · ${ready} ready` },
              { label: 'Queue', value: received + preparing, prefix: '', icon: Users, color: 'from-blue-400 to-violet-500', sub: `~${estimatedWait} min wait` },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative rounded-2xl bg-[rgba(10,9,18,0.6)] backdrop-blur border p-5 overflow-hidden ${card.urgent ? 'border-amber-500/25 ring-1 ring-amber-500/15' : 'border-white/[0.06]'}`}
              >
                {card.urgent && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,transparent_65%)] pointer-events-none" />
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  {card.spark && <MiniSparkline data={sparkData} />}
                </div>
                <AnimatedCounter value={card.value} prefix={card.prefix} className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{card.label}</p>
                {card.sub && <p className="text-[10px] text-zinc-600 font-semibold mt-0.5">{card.sub}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 pt-6 relative z-10 space-y-6">

        {/* ═══ ROW 1: Urgent Actions + Store Control ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Needs Preparation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 rounded-2xl bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-md">
                  <Hand className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Needs Prep</h2>
                  <p className="text-[9px] text-zinc-600 font-bold">Awaiting action</p>
                </div>
              </div>
              <span className="text-2xl font-black text-white tabular-nums">{received}</span>
            </div>
            {received > 0 ? (
              <div className="space-y-2">
                {orders.filter((o: any) => o.status === 'received').slice(0, 4).map((o: any) => (
                  <Link key={o.id} href="/admin/kitchen" className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all group">
                    <div>
                      <p className="text-xs font-black text-zinc-300">{o.id}</p>
                      <p className="text-[9px] text-zinc-600 font-semibold">{o.customer || o.customerName}</p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-emerald-400/40 group-hover:text-emerald-400 transition-colors" />
                  </Link>
                ))}
                {received > 4 && <p className="text-[9px] text-zinc-600 font-bold text-center pt-1">+{received - 4} more</p>}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-400/30 mx-auto mb-2" />
                <p className="text-xs text-zinc-600 font-bold">All caught up</p>
              </div>
            )}
            <Link href="/admin/kitchen" className="mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-gold hover:border-gold/15 hover:bg-gold/5 transition-all group">
              Open Kitchen <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Ready for Pickup */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="lg:col-span-1 rounded-2xl bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Ready Pickup</h2>
                  <p className="text-[9px] text-zinc-600 font-bold">Waiting collection</p>
                </div>
              </div>
              <span className={`text-2xl font-black tabular-nums ${ready > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>{ready}</span>
            </div>
            {ready > 0 ? (
              <div className="space-y-2">
                {orders.filter((o: any) => o.status === 'ready').slice(0, 4).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div>
                      <p className="text-xs font-black text-zinc-300">{o.id}</p>
                      <p className="text-[9px] text-zinc-600 font-semibold">{o.customer || o.customerName}</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-400">₹{o.amount || 0}</span>
                  </div>
                ))}
                {ready > 4 && <p className="text-[9px] text-zinc-600 font-bold text-center pt-1">+{ready - 4} more</p>}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Package className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600 font-bold">None ready</p>
              </div>
            )}
            <Link href="/admin/orders" className="mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-gold hover:border-gold/15 hover:bg-gold/5 transition-all group">
              All Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* Store Status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="lg:col-span-1 rounded-2xl bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-md">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-wider">Store</h2>
                <p className="text-[9px] text-zinc-600 font-bold">{settings.storeName}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <button onClick={toggleAccepting}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  settings.acceptingOrders
                    ? 'bg-emerald-500/8 border-emerald-500/18 hover:bg-emerald-500/12'
                    : 'bg-amber-500/6 border-amber-500/12 hover:bg-amber-500/10'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Accepting Orders</p>
                  <p className="text-[9px] text-zinc-600 font-semibold mt-0.5">{settings.acceptingOrders ? 'Online orders live' : 'Orders paused'}</p>
                </div>
                <div className={`relative w-11 h-[22px] rounded-full transition-all ${settings.acceptingOrders ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full shadow-md transition-all ${settings.acceptingOrders ? 'left-[22px] bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
                </div>
              </button>

              <button onClick={toggleStore}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  settings.storeOpen
                    ? 'bg-emerald-500/8 border-emerald-500/18 hover:bg-emerald-500/12'
                    : 'bg-rose-500/6 border-rose-500/12 hover:bg-rose-500/10'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Store Status</p>
                  <p className="text-[9px] text-zinc-600 font-semibold mt-0.5">{settings.storeOpen ? 'Open for business' : 'Currently closed'}</p>
                </div>
                <div className={`relative w-11 h-[22px] rounded-full transition-all ${settings.storeOpen ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full shadow-md transition-all ${settings.storeOpen ? 'left-[22px] bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 text-center p-2.5 rounded-xl bg-black/25 border border-white/[0.04]">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Open</p>
                <p className="text-sm font-black text-white">{settings.openingTime}</p>
              </div>
              <div className="flex-1 text-center p-2.5 rounded-xl bg-black/25 border border-white/[0.04]">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Close</p>
                <p className="text-sm font-black text-white">{settings.closingTime}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ ROW 2: Recent Orders + Insights ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-md">
                  <ListOrdered className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Recent Orders</h2>
                  <p className="text-[9px] text-zinc-600 font-bold">Latest activity</p>
                </div>
              </div>
              <Link href="/admin/orders" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gold/8 text-gold border border-gold/12 hover:bg-gold/14 transition-all">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-600 font-bold">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentOrders.map((o: any, i: number) => {
                  const dot: Record<string, string> = { received: 'bg-blue-400', preparing: 'bg-amber-400', ready: 'bg-emerald-400', completed: 'bg-zinc-600' };
                  const label: Record<string, string> = { received: 'Received', preparing: 'Preparing', ready: 'Ready', completed: 'Collected' };
                  return (
                    <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-all">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot[o.status] || 'bg-zinc-600'}`} />
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <span className="text-xs font-black text-zinc-400 shrink-0">{o.id}</span>
                        <span className="text-[11px] text-zinc-300 font-semibold truncate">{o.customer || o.customerName}</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 tabular-nums">₹{o.amount || 0}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        o.status === 'received' ? 'bg-blue-500/12 text-blue-400' :
                        o.status === 'preparing' ? 'bg-amber-500/12 text-amber-400' :
                        o.status === 'ready' ? 'bg-emerald-500/12 text-emerald-400' :
                        'bg-zinc-500/10 text-zinc-500'
                      }`}>{label[o.status] || o.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.23 }}
            className="rounded-2xl bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow-md">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white uppercase tracking-wider">Insights</h2>
                <p className="text-[9px] text-zinc-600 font-bold">Today's performance</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Best Seller */}
              <div className="rounded-xl bg-black/25 border border-white/[0.04] p-3.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Best Seller</span>
                  <span className="text-[9px] font-bold text-zinc-500">{bestCount} sold</span>
                </div>
                <p className="text-sm font-black text-white truncate">{bestSeller}</p>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500" style={{ width: `${Math.min(100, (bestCount / Math.max(1, bestCount)) * 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-black/25 border border-white/[0.04] p-3">
                  <Zap className="w-4 h-4 text-amber-400 mb-1.5" />
                  <p className="text-lg font-black text-white">{peakHour}</p>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Peak Hour</p>
                </div>
                <div className="rounded-xl bg-black/25 border border-white/[0.04] p-3">
                  <IndianRupee className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <p className="text-lg font-black text-white">₹{avgValue}</p>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Avg Order</p>
                </div>
                <div className="rounded-xl bg-black/25 border border-white/[0.04] p-3">
                  <CheckCircle className="w-4 h-4 text-blue-400 mb-1.5" />
                  <p className="text-lg font-black text-white">{totalOrders ? `${Math.round(completed / totalOrders * 100)}%` : '0%'}</p>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Completed</p>
                </div>
                <div className="rounded-xl bg-black/25 border border-white/[0.04] p-3">
                  <Timer className="w-4 h-4 text-gold mb-1.5" />
                  <p className="text-lg font-black text-white">{settings.averagePrepTime}m</p>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Prep Time</p>
                </div>
              </div>

              <Link href="/admin/analytics" className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gold/5 to-amber-500/5 border border-gold/10 hover:border-gold/20 transition-all group">
                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">Full Analytics</span>
                <BarChart3 className="w-3.5 h-3.5 text-gold/40 group-hover:text-gold transition-colors" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ═══ Alert Banner ═══ */}
        {pendingOrders > 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/8 border border-amber-500/15">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs font-bold text-zinc-300"><span className="text-amber-400">{pendingOrders}</span> orders pending — Consider adjusting capacity.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
