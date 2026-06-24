'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  IndianRupee, Clock, CheckCircle, CookingPot,
  TrendingUp, Zap, ArrowRight, Package, Users,
  Database, AlertTriangle, Play, Timer, Store, Power
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { seedSampleData, isSeeded, getStoredOrders, saveOrders } from '@/lib/seed-data';
import { loadSettings, saveSettings } from '@/lib/store';

function AnimatedNumber({ value, prefix = '', className = '' }: { value: number; prefix?: string; className?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const duration = 800;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span ref={ref} className={className}>{prefix}{count}</span>;
}

const statusColors: Record<string, string> = {
  received: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  preparing: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  ready: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  completed: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/15',
};

const statusDot: Record<string, string> = {
  received: 'bg-blue-400',
  preparing: 'bg-amber-400',
  ready: 'bg-emerald-400',
  completed: 'bg-zinc-600',
};

const statusAction: Record<string, { label: string; next: string; color: string }> = {
  received: { label: 'Start Prep', next: 'preparing', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  preparing: { label: 'Mark Ready', next: 'ready', color: 'bg-amber-500 hover:bg-amber-600 text-black' },
  ready: { label: 'Collected', next: 'completed', color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState(loadSettings());
  const [seeded, setSeeded] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSeeded(isSeeded());
    const stored = getStoredOrders();
    if (stored) setOrders(stored);
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

  const updateStatus = (id: string, status: string) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status } : o);
      saveOrders(updated);
      return updated;
    });
  };

  const now = new Date();
  const revenue = orders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const received = orders.filter(o => o.status === 'received');
  const preparing = orders.filter(o => o.status === 'preparing');
  const ready = orders.filter(o => o.status === 'ready');
  const completed = orders.filter(o => o.status === 'completed');
  const pending = received.length + preparing.length + ready.length;
  const queue = received.length + preparing.length;
  const wait = received.length > 0 ? Math.round(received.length * settings.averagePrepTime / Math.max(1, Math.ceil(received.length / 2))) : 0;
  const avgValue = orders.length ? Math.round(revenue / orders.length) : 0;

  const itemCounts: Record<string, number> = {};
  orders.forEach((o: any) => (o.items || []).forEach((it: any) => {
    const name = it.name || it.menuItemId;
    itemCounts[name] = (itemCounts[name] || 0) + (it.qty || 1);
  }));
  const sorted = Object.entries(itemCounts).sort(([, a], [, b]) => b - a);
  const bestSeller = sorted.length ? sorted[0][0] : 'N/A';
  const bestCount = sorted.length ? sorted[0][1] : 0;

  const hours: Record<string, number> = {};
  orders.forEach((o: any) => {
    const h = o.pickupTime ? o.pickupTime.split(':')[0] : '12';
    hours[h] = (hours[h] || 0) + 1;
  });
  const peak = Object.entries(hours).sort(([, a], [, b]) => b - a);
  const peakHour = peak.length ? `${peak[0][0]}:00` : 'N/A';

  const recent = [...orders].sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

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
    <div className="min-h-screen bg-[#06060A]">

      {/* ── Header ── */}
      <div className="border-b border-white/[0.04] bg-[#0A0A12]/60">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {settings.storeName}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${isLive ? 'bg-emerald-500/10 border-emerald-500/25' : settings.storeOpen ? 'bg-amber-500/10 border-amber-500/25' : 'bg-rose-500/10 border-rose-500/25'}`}>
                <span className="relative flex h-2.5 w-2.5">
                  {isLive && <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60" />}
                  <span className={`relative rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-400' : settings.storeOpen ? 'bg-amber-400' : 'bg-rose-400'}`} />
                </span>
                <span className={`text-xs font-black tracking-wider ${isLive ? 'text-emerald-300' : settings.storeOpen ? 'text-amber-300' : 'text-rose-300'}`}>
                  {!settings.storeOpen ? 'CLOSED' : !settings.acceptingOrders ? 'PAUSED' : 'OPEN'}
                </span>
              </div>
              <button onClick={toggleAccepting} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${settings.acceptingOrders ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-zinc-900 border-zinc-700/50 text-zinc-500 hover:text-amber-300'}`}>
                <Power className="w-3.5 h-3.5" /> {settings.acceptingOrders ? 'Accepting' : 'Paused'}
              </button>
              <button onClick={toggleStore} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${settings.storeOpen ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-zinc-900 border-zinc-700/50 text-zinc-500 hover:text-rose-300'}`}>
                <Store className="w-3.5 h-3.5" /> {settings.storeOpen ? 'Open' : 'Closed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-6 space-y-8">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Revenue Today', value: revenue, prefix: '₹', icon: IndianRupee, gradient: 'from-emerald-400 to-green-500' },
            { label: 'Pending Orders', value: pending, prefix: '', icon: Clock, gradient: 'from-amber-400 to-orange-500', highlight: pending > 0 },
            { label: 'In Queue', value: queue, prefix: '', icon: Users, gradient: 'from-blue-400 to-violet-500', meta: `~${wait} min` },
            { label: 'Avg Order Value', value: avgValue, prefix: '₹', icon: Package, gradient: 'from-gold to-amber-500' },
          ].map((kpi, i) => (
            <div key={kpi.label} className={`relative rounded-2xl bg-[#0C0C16] border p-5 transition-all ${kpi.highlight ? 'border-amber-500/25 ring-1 ring-amber-500/10' : 'border-white/[0.05]'}`}>
              {kpi.highlight && <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)] pointer-events-none" />}
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                {kpi.meta && <span className="text-xs text-zinc-600 font-medium">{kpi.meta}</span>}
              </div>
              <AnimatedNumber value={kpi.value} prefix={kpi.prefix} className="text-3xl font-black text-white tabular-nums tracking-tight" />
              <p className="text-xs text-zinc-500 font-medium mt-1.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Order Pipeline ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Order Pipeline</h2>
            <Link href="/admin/kitchen" className="text-xs font-medium text-gold hover:text-amber-400 transition-colors flex items-center gap-1">
              Full Kitchen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Awaiting Prep', items: received, key: 'received' as const },
              { title: 'In Progress', items: preparing, key: 'preparing' as const },
              { title: 'Ready', items: ready, key: 'ready' as const },
            ].map(stage => {
              const action = statusAction[stage.key];
              const dotColor = statusDot[stage.key];
              return (
                <div key={stage.key} className="rounded-2xl bg-[#0C0C16] border border-white/[0.05] p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      <span className="text-sm font-bold text-white">{stage.title}</span>
                    </div>
                    <span className={`text-xl font-black ${stage.items.length > 0 ? 'text-white' : 'text-zinc-600'}`}>{stage.items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {stage.items.length === 0 ? (
                      <p className="text-sm text-zinc-600 text-center py-6">No orders</p>
                    ) : (
                      stage.items.slice(0, 4).map(o => (
                        <div key={o.id} className="bg-black/30 rounded-xl p-3 border border-white/[0.03]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-zinc-300">{o.id}</span>
                            <span className="text-xs text-zinc-600">₹{o.amount || 0}</span>
                          </div>
                          <p className="text-sm text-zinc-500">{o.customer || o.customerName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-zinc-600">{o.pickupTime ? `Pickup ${o.pickupTime}` : ''}</span>
                            <button
                              onClick={() => updateStatus(o.id, action.next)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg ${action.color} transition-all active:scale-95`}
                            >
                              {action.label}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {stage.items.length > 4 && (
                    <p className="text-xs text-zinc-600 font-medium text-center mt-2">+{stage.items.length - 4} more</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-2xl bg-[#0C0C16] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
              <h2 className="text-sm font-bold text-white">Recent Activity</h2>
              <Link href="/admin/orders" className="text-xs font-medium text-gold hover:text-amber-400 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-8">No orders yet</p>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {recent.map((o: any) => (
                  <div key={o.id} className="flex items-center gap-4 py-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[o.status] || 'bg-zinc-600'}`} />
                    <span className="text-sm font-bold text-zinc-400 w-20 shrink-0">{o.id}</span>
                    <span className="text-sm text-zinc-300 flex-1 truncate">{o.customer || o.customerName}</span>
                    <span className="text-sm font-bold text-zinc-400 w-16 text-right">₹{o.amount || 0}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusColors[o.status] || 'bg-zinc-500/10 text-zinc-500'}`}>
                      {o.status === 'received' ? 'New' : o.status === 'preparing' ? 'Cooking' : o.status === 'ready' ? 'Ready' : 'Done'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="rounded-2xl bg-[#0C0C16] border border-white/[0.05] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04]">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-bold text-white">Insights</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/[0.03]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-500 font-medium">Best Seller</span>
                  <span className="text-sm font-bold text-gold">{bestCount}×</span>
                </div>
                <p className="text-base font-bold text-white truncate">{bestSeller}</p>
                <div className="mt-2.5 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-xl p-3.5 text-center border border-white/[0.03]">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-white">{peakHour}</p>
                  <p className="text-xs text-zinc-600">Peak Hour</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3.5 text-center border border-white/[0.03]">
                  <Timer className="w-5 h-5 text-gold mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-white">{settings.averagePrepTime}m</p>
                  <p className="text-xs text-zinc-600">Prep Time</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3.5 text-center border border-white/[0.03]">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-white">{orders.length ? `${Math.round(completed.length / orders.length * 100)}%` : '0%'}</p>
                  <p className="text-xs text-zinc-600">Fulfilled</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3.5 text-center border border-white/[0.03]">
                  <IndianRupee className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-white">{avgValue}</p>
                  <p className="text-xs text-zinc-600">Avg Value</p>
                </div>
              </div>
              <Link href="/admin/analytics" className="flex items-center justify-between p-3.5 rounded-xl bg-gold/5 border border-gold/10 hover:border-gold/20 transition-all">
                <span className="text-sm font-medium text-zinc-400">Full Analytics</span>
                <ArrowRight className="w-4 h-4 text-gold/50" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Seed/Clear & Alerts ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            {pending > 5 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-sm text-zinc-400"><span className="text-amber-400 font-bold">{pending} orders</span> in queue — consider pausing new orders.</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleSeedData} disabled={seeded}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${seeded ? 'bg-emerald-500/5 text-emerald-400/30 border-emerald-500/10 cursor-default' : 'bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:text-zinc-200'}`}
            >
              <Database className="w-3.5 h-3.5" /> {seeded ? 'Seeded' : 'Seed Data'}
            </button>
            {confirmClear ? (
              <div className="flex items-center gap-1">
                <button onClick={handleClearData} className="px-3 py-2 rounded-xl border bg-red-500/15 text-red-400 border-red-500/25 text-xs font-medium">Confirm</button>
                <button onClick={() => setConfirmClear(false)} className="px-3 py-2 rounded-xl border border-white/6 text-zinc-500 text-xs font-medium">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="px-3 py-2 rounded-xl border border-white/[0.04] text-zinc-500 hover:text-rose-400 text-xs font-medium">Clear Data</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
