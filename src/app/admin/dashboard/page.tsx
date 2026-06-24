'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag, IndianRupee, Clock, CheckCircle, CookingPot,
  TrendingUp, Zap, ArrowRight, ChevronRight, Package, Users,
  Database, AlertTriangle, BarChart3, ListOrdered, Play, Timer, Store, Power
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { seedSampleData, isSeeded, getStoredOrders, saveOrders } from '@/lib/seed-data';
import { loadSettings, saveSettings } from '@/lib/store';

function AnimatedCounter({ value, prefix = '', suffix = '', className = '' }: { value: number; prefix?: string; suffix?: string; className?: string }) {
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
      else setCount(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);
  return <span ref={ref} className={className}>{prefix}{count}{suffix}</span>;
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

  const updateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      saveOrders(updated);
      return updated;
    });
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const pendingOrders = orders.filter((o: any) => o.status !== 'completed').length;
  const receivedList = orders.filter((o: any) => o.status === 'received');
  const preparingList = orders.filter((o: any) => o.status === 'preparing');
  const readyList = orders.filter((o: any) => o.status === 'ready');
  
  const receivedCount = receivedList.length;
  const preparingCount = preparingList.length;
  const readyCount = readyList.length;
  const completedCount = orders.filter((o: any) => o.status === 'completed').length;
  
  const avgValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const queueLen = receivedCount + preparingCount;
  const estimatedWait = receivedCount > 0 ? Math.round(receivedCount * settings.averagePrepTime / Math.max(1, Math.ceil(receivedCount / 2))) : 0;

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

  const recentOrders = [...orders]
    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

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

  const isLive = settings.storeOpen && settings.acceptingOrders;

  return (
    <div className="min-h-screen bg-[#06060A] pb-16 text-zinc-100">
      
      {/* ═══════════════════════════════════════════════════ */}
      {/* HEADER COMMAND BAR                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="border-b border-white/[0.04] bg-gradient-to-b from-black/40 to-transparent">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Title & Info */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl border transition-all duration-500 shadow-lg ${
                isLive 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-950/20' 
                  : settings.storeOpen 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-950/20' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-950/20'
              }`}>
                <Store className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">{settings.storeName}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    isLive 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : settings.storeOpen 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : settings.storeOpen ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    {!settings.storeOpen ? 'CLOSED' : !settings.acceptingOrders ? 'PAUSED' : 'OPEN'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 font-semibold">
                  {now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Quick Toggle Controls */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Toggle Accepting Orders */}
              <button
                onClick={toggleAccepting}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-black uppercase tracking-wider text-xs transition-all duration-300 active:scale-95 shadow-md ${
                  settings.acceptingOrders
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                    : 'bg-zinc-900/50 border-white/[0.04] text-zinc-500 hover:text-amber-400 hover:border-amber-500/30'
                }`}
              >
                <Power className="w-4 h-4" />
                <span className="hidden sm:inline">Online Orders:</span> {settings.acceptingOrders ? 'Accepting' : 'Paused'}
              </button>

              {/* Toggle Store Status */}
              <button
                onClick={toggleStore}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-black uppercase tracking-wider text-xs transition-all duration-300 active:scale-95 shadow-md ${
                  settings.storeOpen
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                    : 'bg-zinc-900/50 border-white/[0.04] text-zinc-500 hover:text-rose-400 hover:border-rose-500/30'
                }`}
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Storefront:</span> {settings.storeOpen ? 'Open' : 'Closed'}
              </button>

            </div>

          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-6 space-y-6">

        {/* ═══════════════════════════════════════════════════ */}
        {/* PRIORITY 1: KITCHEN COMMAND HUB                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CookingPot className="w-5 h-5 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Live Kitchen & Pickup Command</h2>
            </div>
            <Link href="/admin/kitchen" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/15 text-gold border border-gold/15 text-[10px] font-black uppercase tracking-wider transition-all">
              Go to Kitchen <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Awaiting Prep (Received) */}
            <div className="rounded-xl bg-black/40 border border-white/[0.03] p-4 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">1. Awaiting Prep</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">{receivedCount}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] [scrollbar-width:thin]">
                {receivedList.length > 0 ? (
                  receivedList.slice(0, 3).map((o: any) => (
                    <div key={o.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center justify-between text-xs font-black text-zinc-300">
                        <span>{o.id}</span>
                        <span className="text-[10px] text-zinc-500">Pickup {o.pickupTime}</span>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 mt-1 truncate">{o.customer || o.customerName}</p>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed bg-black/25 p-1.5 rounded border border-white/[0.02]">
                        {o.items.map((it: any, idx: number) => (
                          <div key={idx}><span className="text-gold font-bold">{it.qty}x</span> {it.name}</div>
                        ))}
                      </div>
                      <button
                        onClick={() => updateStatus(o.id, 'preparing')}
                        className="w-full mt-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/20 active:scale-95 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" /> Start Preparing
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-400 font-bold">No orders waiting</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: In the Kitchen (Preparing) */}
            <div className="rounded-xl bg-black/40 border border-white/[0.03] p-4 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">2. Preparing</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">{preparingCount}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] [scrollbar-width:thin]">
                {preparingList.length > 0 ? (
                  preparingList.slice(0, 3).map((o: any) => (
                    <div key={o.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center justify-between text-xs font-black text-zinc-300">
                        <span>{o.id}</span>
                        <span className="text-[10px] text-zinc-500">Pickup {o.pickupTime}</span>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 mt-1 truncate">{o.customer || o.customerName}</p>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed bg-black/25 p-1.5 rounded border border-white/[0.02]">
                        {o.items.map((it: any, idx: number) => (
                          <div key={idx}><span className="text-gold font-bold">{it.qty}x</span> {it.name}</div>
                        ))}
                      </div>
                      <button
                        onClick={() => updateStatus(o.id, 'ready')}
                        className="w-full mt-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-[9px] rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/20 active:scale-95 transition-all"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Ready
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                    <CookingPot className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-400 font-bold">Kitchen is quiet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Ready for Pickup */}
            <div className="rounded-xl bg-black/40 border border-white/[0.03] p-4 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">3. Ready for Pickup</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{readyCount}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] [scrollbar-width:thin]">
                {readyList.length > 0 ? (
                  readyList.slice(0, 3).map((o: any) => (
                    <div key={o.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center justify-between text-xs font-black text-zinc-300">
                        <span>{o.id}</span>
                        <span className="text-[10px] text-zinc-500">Amt: ₹{o.amount}</span>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 mt-1 truncate">{o.customer || o.customerName}</p>
                      <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed bg-black/25 p-1.5 rounded border border-white/[0.02]">
                        {o.items.map((it: any, idx: number) => (
                          <div key={idx}><span className="text-gold font-bold">{it.qty}x</span> {it.name}</div>
                        ))}
                      </div>
                      <button
                        onClick={() => updateStatus(o.id, 'completed')}
                        className="w-full mt-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black uppercase tracking-widest text-[9px] rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
                      >
                        <Package className="w-3.5 h-3.5" /> Collected
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                    <Package className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-400 font-bold">Nothing waiting pickup</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* PRIORITY 2: LIVE METRICS COMMAND GRID               */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Revenue', value: totalRevenue, prefix: '₹', icon: IndianRupee, color: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-950/30', sub: `${totalOrders} Orders Total` },
            { label: 'Pending Orders', value: pendingOrders, prefix: '', icon: Clock, color: 'from-amber-400 to-orange-500', glow: 'shadow-amber-950/30', urgent: pendingOrders > 0, sub: `${preparingCount} cooking · ${readyCount} ready` },
            { label: 'Active Queue', value: queueLen, prefix: '', icon: Users, color: 'from-blue-400 to-violet-500', glow: 'shadow-blue-950/30', sub: `~${estimatedWait} Min Wait` },
            { label: 'Average Value', value: avgValue, prefix: '₹', icon: ShoppingBag, color: 'from-gold to-amber-600', glow: 'shadow-yellow-950/30', sub: 'Per Order Value' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              className={`relative rounded-2xl bg-[#0B0B12]/80 border p-5 backdrop-blur-lg shadow-lg ${
                card.urgent 
                  ? 'border-amber-500/20 ring-1 ring-amber-500/10' 
                  : 'border-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg ${card.glow}`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-zinc-550">{card.sub}</span>
              </div>
              <AnimatedCounter value={card.value} prefix={card.prefix} className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight" />
              <p className="text-[10px] font-black text-zinc-550 uppercase tracking-widest mt-1.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* PRIORITY 3: RECENT ORDERS LOG & ANALYTICS INSIGHTS  */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders Log */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl bg-[#0B0B12]/80 border border-white/[0.04] p-5 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <ListOrdered className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Recent Orders</h2>
                </div>
                <Link href="/admin/orders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gold/10 hover:bg-gold/15 text-gold border border-gold/15 transition-all">
                  All Orders <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-12"><p className="text-sm text-zinc-400 font-bold">No orders recorded yet.</p></div>
              ) : (
                <div className="space-y-1">
                  {recentOrders.map((o: any) => {
                    const dot: Record<string, string> = { received: 'bg-blue-400', preparing: 'bg-amber-400', ready: 'bg-emerald-400', completed: 'bg-zinc-500' };
                    const label: Record<string, string> = { received: 'New', preparing: 'Cooking', ready: 'Ready', completed: 'Done' };
                    return (
                      <div key={o.id} className="flex items-center gap-4 py-3 px-3 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.03] transition-all">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot[o.status] || 'bg-zinc-500'}`} />
                        <span className="text-xs font-black text-zinc-400 w-16 shrink-0">{o.id}</span>
                        <span className="text-xs font-bold text-zinc-300 truncate flex-1">{o.customer || o.customerName}</span>
                        <span className="text-xs font-black text-zinc-400 tabular-nums w-16 text-right shrink-0">₹{o.amount || 0}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shrink-0 ${
                          o.status === 'received' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          o.status === 'preparing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          o.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border border-white/[0.04]'
                        }`}>{label[o.status] || o.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Performance Insights */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-[#0B0B12]/80 border border-white/[0.04] p-5 shadow-lg"
          >
            <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-white/[0.04]">
              <TrendingUp className="w-5 h-5 text-zinc-400" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Kitchen Insights</h2>
            </div>
            
            <div className="space-y-4">
              
              {/* Best Seller */}
              <div className="rounded-xl bg-black/40 border border-white/[0.03] p-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Top Selling Item</span>
                  <span className="text-[10px] font-black text-gold">{bestCount} Orders</span>
                </div>
                <p className="text-sm font-black text-white truncate">{bestSeller}</p>
                <div className="mt-2.5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Grid items */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/40 border border-white/[0.03] p-3 shadow-inner">
                  <Zap className="w-4.5 h-4.5 text-amber-400 mb-1" />
                  <p className="text-lg font-black text-white">{peakHour}</p>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Peak Traffic Hour</p>
                </div>
                <div className="rounded-xl bg-black/40 border border-white/[0.03] p-3 shadow-inner">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400 mb-1" />
                  <p className="text-lg font-black text-white">{totalOrders ? `${Math.round(completedCount / totalOrders * 100)}%` : '0%'}</p>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Fulfillment Rate</p>
                </div>
                <div className="rounded-xl bg-black/40 border border-white/[0.03] p-3 shadow-inner">
                  <Timer className="w-4.5 h-4.5 text-gold mb-1" />
                  <p className="text-lg font-black text-white">{settings.averagePrepTime}m</p>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Avg Prep Limit</p>
                </div>
                <div className="rounded-xl bg-black/40 border border-white/[0.03] p-3 shadow-inner">
                  <ShoppingBag className="w-4.5 h-4.5 text-blue-400 mb-1" />
                  <p className="text-lg font-black text-white">{completedCount}</p>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Collected</p>
                </div>
              </div>

              <Link href="/admin/analytics" className="flex items-center justify-between p-3 rounded-xl bg-gold/5 hover:bg-gold/10 border border-gold/10 hover:border-gold/20 transition-all group mt-2">
                <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-wider">Comprehensive Analytics</span>
                <BarChart3 className="w-4 h-4 text-gold/50 group-hover:text-gold transition-colors" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* PRIORITY 4: SYSTEM UTILITIES & ALERTS               */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Backlog Alert */}
          <div className="md:col-span-2">
            {pendingOrders > 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-md">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs font-semibold text-zinc-300">
                  <span className="text-amber-400 font-bold">{pendingOrders} active orders</span> currently in queue. Consider increasing kitchen preparation limit or pausing storefront orders.
                </p>
              </motion.div>
            )}
          </div>

          {/* Database Control Panel */}
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-550" />
              <span className="text-[10px] font-black text-zinc-550 uppercase tracking-wider">System Utilities</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSeedData} 
                disabled={seeded}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  seeded 
                    ? 'bg-emerald-500/5 text-emerald-400/40 border-emerald-500/10 cursor-default' 
                    : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {seeded ? 'Seeded' : 'Seed DB'}
              </button>
              
              {confirmClear ? (
                <div className="flex items-center gap-1 animate-fade-in">
                  <button onClick={handleClearData} className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30">Confirm</button>
                  <button onClick={() => setConfirmClear(false)} className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/[0.06] text-zinc-400 hover:text-white">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/[0.04] text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5">Clear DB</button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
