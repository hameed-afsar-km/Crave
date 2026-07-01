'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee, Clock, CheckCircle, CookingPot,
  TrendingUp, Zap, ArrowRight, Package, Users,
  Database, AlertTriangle, Store, Power, Ban, X,
  Gift, Plus, Trash2, MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { seedSampleData, isSeeded } from '@/lib/seed-data';
import { loadSettings, saveSettings } from '@/lib/store';
import { subscribeOrders, updateOrderStatus, subscribeSettings, saveSettingsToFirestore, syncLocalToFirestore } from '@/lib/firestore-service';
import { AnimatedCounter } from '@/components/admin/AnimatedCounter';
import { BarChart } from '@/components/admin/BarChart';
import { hourlyRevenue } from '@/lib/revenue';

const statusColors: Record<string, string> = {
  received: 'bg-blue-500/10 text-blue-400',
  preparing: 'bg-amber-500/10 text-amber-400',
  ready: 'bg-emerald-500/10 text-emerald-400',
  completed: 'bg-zinc-500/10 text-zinc-500',
};

const chartGold = '#d4af37';

const statusDot: Record<string, string> = {
  received: 'bg-blue-500',
  preparing: 'bg-amber-500',
  ready: 'bg-emerald-500',
  completed: 'bg-zinc-600',
};

const statusAction: Record<string, { label: string; next: string; color: string }> = {
  received: { label: 'Start Prep', next: 'preparing', color: 'bg-blue-600 hover:bg-blue-500 text-white' },
  preparing: { label: 'Mark Ready', next: 'ready', color: 'bg-amber-600 hover:bg-amber-500 text-white' },
  ready: { label: 'Collected', next: 'completed', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
};



export default function AdminDashboard() {
  const { isAdmin, isMasterAdmin, isOutletStaff, user } = useAuth();
  const { selectedOutletId, outlets, setSelectedOutletId, isAllOutlets } = useAdminOutlet();
  const [settings, setSettings] = useState(loadSettings());
  const [seeded, setSeeded] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [localEarnRate, setLocalEarnRate] = useState(settings.earnRate || 10);
  const [localRewards, setLocalRewards] = useState(settings.rewards || []);

  useEffect(() => {
    setSeeded(isSeeded());
    const unsubOrders = subscribeOrders((firestoreOrders) => {
      const mapped = firestoreOrders.map((o: any) => ({
        ...o,
        customer: o.customerName || o.customer || '',
        phone: o.customerPhone || o.phone || '',
        items: o.items || [],
      }));
      setOrders(mapped);
    });
    const unsubSettings = subscribeSettings((firestoreSettings) => {
      setSettings(firestoreSettings);
    });
    return () => { unsubOrders(); unsubSettings(); };
  }, []);

  useEffect(() => {
    setLocalEarnRate(settings.earnRate || 10);
    setLocalRewards(settings.rewards || []);
  }, [settings]);

  const addReward = () => {
    const id = `reward-${Date.now()}`;
    setLocalRewards(prev => [...prev, { id, name: '', description: '', cost: 100, available: true }]);
  };

  const removeReward = (id: string) => {
    setLocalRewards(prev => prev.filter(r => r.id !== id));
  };

  const updateReward = (id: string, field: string, value: any) => {
    setLocalRewards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const saveRewards = () => {
    const next = { ...settings, earnRate: localEarnRate, rewards: localRewards };
    setSettings(next);
    saveSettings(next);
    saveSettingsToFirestore(next);
  };

  const toggleStore = () => {
    if (settings.storeOpen) { setConfirmClose(true); return; }
    const next = { ...settings, storeOpen: true };
    setSettings(next); saveSettings(next); saveSettingsToFirestore(next);
  };

  const handleCloseConfirm = () => {
    const next = { ...settings, storeOpen: false };
    setSettings(next); saveSettings(next); saveSettingsToFirestore(next); setConfirmClose(false);
  };

  const toggleAccepting = () => {
    if (settings.acceptingOrders) { setConfirmPause(true); return; }
    const next = { ...settings, acceptingOrders: true };
    setSettings(next); saveSettings(next); saveSettingsToFirestore(next);
  };

  const handlePauseConfirm = () => {
    const next = { ...settings, acceptingOrders: false };
    setSettings(next); saveSettings(next); saveSettingsToFirestore(next); setConfirmPause(false);
  };

  const handleSeedData = async () => {
    seedSampleData(); setSeeded(true);
    try {
      await syncLocalToFirestore();
    } catch {
      // Firestore may not be available
    }
    const { logAction } = await import('@/lib/audit');
    logAction('data.seeded', 'data', 'all', {}, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const handleClearData = () => {
    ['crave-orders', 'crave-last-order', 'crave-menu-items', 'crave-seeded'].forEach(k => localStorage.removeItem(k));
    setSeeded(false); setOrders([]); setConfirmClear(false);
    import('@/lib/audit').then(({ logAction }) =>
      logAction('data.cleared', 'data', 'all', {}, { email: user?.email || '', role: user?.role || '', name: user?.name || '' })
    );
  };

  const updateStatus = (id: string, status: string) => {
    updateOrderStatus(id, status as any, undefined, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const filteredOrders = isAllOutlets
    ? orders
    : orders.filter((o: any) => o.outletId === selectedOutletId);

  const now = new Date();
  const revenue = filteredOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const received = filteredOrders.filter(o => o.status === 'received');
  const preparing = filteredOrders.filter(o => o.status === 'preparing');
  const ready = filteredOrders.filter(o => o.status === 'ready');
  const completed = filteredOrders.filter(o => o.status === 'completed');
  const pending = received.length + preparing.length + ready.length;
  const queue = received.length + preparing.length;
  const wait = received.length > 0 ? Math.round(received.length * settings.averagePrepTime / Math.max(1, Math.ceil(received.length / 2))) : 0;
  const avgValue = filteredOrders.length ? Math.round(revenue / filteredOrders.length) : 0;

  const itemCounts: Record<string, number> = {};
  filteredOrders.forEach((o: any) => (o.items || []).forEach((it: any) => {
    const name = it.name || it.menuItemId;
    itemCounts[name] = (itemCounts[name] || 0) + (it.qty || 1);
  }));
  const sorted = Object.entries(itemCounts).sort(([, a], [, b]) => b - a);
  const bestSeller = sorted.length ? sorted[0][0] : 'N/A';
  const bestCount = sorted.length ? sorted[0][1] : 0;

  const hours: Record<string, number> = {};
  filteredOrders.forEach((o: any) => {
    const h = o.pickupTime ? o.pickupTime.split(':')[0] : '12';
    hours[h] = (hours[h] || 0) + 1;
  });
  const peak = Object.entries(hours).sort(([, a], [, b]) => b - a);
  const peakHour = peak.length ? `${peak[0][0]}:00` : 'N/A';

  const recent = [...filteredOrders].sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-500 text-sm mb-6">Administrator credentials required.</p>
          <Link href="/" className="px-6 py-2.5 bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:bg-zinc-700 transition-all">Go Home</Link>
        </div>
      </div>
    );
  }

  const isLive = settings.storeOpen && settings.acceptingOrders;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="border-b border-zinc-800/60 bg-[#0D0D14]">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">
                {settings.storeName}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                isLive ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                settings.storeOpen ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                'bg-red-500/10 border-red-500/25 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isLive ? 'bg-emerald-500' : settings.storeOpen ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                {!settings.storeOpen ? 'Closed' : !settings.acceptingOrders ? 'Paused' : 'Open'}
              </div>
              <button onClick={toggleAccepting} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                settings.acceptingOrders ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}>
                <Power className="w-3.5 h-3.5 inline mr-1" />
                {settings.acceptingOrders ? 'Accepting' : 'Paused'}
              </button>
              <button onClick={toggleStore} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                settings.storeOpen ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}>
                <Store className="w-3.5 h-3.5 inline mr-1" />
                {settings.storeOpen ? 'Open' : 'Closed'}
              </button>
            </div>
          </div>

          {/* Outlet selector for Master Admin */}
          {isMasterAdmin && outlets.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
              <button
                onClick={() => setSelectedOutletId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isAllOutlets ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                <MapPin className="w-3 h-3" />
                All Outlets
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isAllOutlets ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}`}>
                  {orders.length}
                </span>
              </button>
              {outlets.map((outlet) => (
                <button
                  key={outlet.id}
                  onClick={() => setSelectedOutletId(outlet.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedOutletId === outlet.id ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {outlet.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedOutletId === outlet.id ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}`}>
                    {orders.filter((o: any) => o.outletId === outlet.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!isMasterAdmin && outlets.find(o => o.id === selectedOutletId) && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-xs font-medium text-zinc-400">
                <MapPin className="w-3 h-3" />
                {outlets.find(o => o.id === selectedOutletId)?.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-6 max-w-screen-2xl mx-auto">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Revenue Today', value: revenue, prefix: '₹', icon: IndianRupee },
            { label: 'Pending Orders', value: pending, prefix: '', icon: Clock, highlight: pending > 0 },
            { label: 'In Queue', value: queue, prefix: '', icon: Users, meta: `~${wait} min` },
            { label: 'Avg Order Value', value: avgValue, prefix: '₹', icon: Package },
          ].map((kpi) => (
            <div key={kpi.label} className={`bg-[#12121A] rounded-xl border ${kpi.highlight ? 'border-amber-500/20' : 'border-zinc-800/60'} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                  <kpi.icon className="w-4 h-4 text-zinc-400" />
                </div>
                {kpi.meta && <span className="text-xs text-zinc-500">{kpi.meta}</span>}
              </div>
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} />
              <p className="text-xs text-zinc-500 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Order Pipeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-200">Order Pipeline</h2>
            <Link href="/admin/kitchen" className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
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
                <div key={stage.key} className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-sm font-semibold text-zinc-200">{stage.title}</span>
                    </div>
                    <span className={`text-lg font-bold ${stage.items.length > 0 ? 'text-white' : 'text-zinc-600'}`}>{stage.items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {stage.items.length === 0 ? (
                      <p className="text-sm text-zinc-600 text-center py-4">No orders</p>
                    ) : (
                      stage.items.slice(0, 4).map(o => (
                        <div key={o.id} className="bg-zinc-800/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-semibold text-zinc-300">{o.id}</span>
                            <span className="text-xs text-zinc-500">₹{o.amount || 0}</span>
                          </div>
                          <p className="text-sm text-zinc-500">{o.customer || o.customerName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-zinc-600">{o.pickupTime ? `${o.pickupTime}` : ''}</span>
                            <button onClick={() => updateStatus(o.id, action.next)} className={`text-xs font-medium px-2.5 py-1 rounded-md ${action.color} transition-all active:scale-95`}>
                              {action.label}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {stage.items.length > 4 && (
                    <p className="text-xs text-zinc-600 text-center mt-2">+{stage.items.length - 4} more</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Revenue Trend</h2>
            </div>
            <span className="text-xs text-zinc-500">Today</span>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-6">No data yet</p>
          ) : (
            <BarChart data={hourlyRevenue(orders)} color={chartGold} />
          )}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
              <h2 className="text-sm font-semibold text-zinc-200">Recent Activity</h2>
              <Link href="/admin/orders" className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-zinc-600 text-center py-6">No orders yet</p>
            ) : (
              <div className="divide-y divide-zinc-800/40">
                {recent.map((o: any) => (
                  <div key={o.id} className="flex items-center gap-4 py-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[o.status] || 'bg-zinc-600'}`} />
                    <span className="text-sm font-medium text-zinc-400 w-28 shrink-0">{o.id}</span>
                    <span className="text-sm text-zinc-400 flex-1 truncate ml-2">{o.customer || o.customerName}</span>
                    <span className="text-sm font-medium text-zinc-300 w-16 text-right">₹{o.amount || 0}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusColors[o.status] || 'bg-zinc-500/10 text-zinc-500'}`}>
                      {o.status === 'received' ? 'New' : o.status === 'preparing' ? 'Cooking' : o.status === 'ready' ? 'Ready' : 'Done'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/60">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Insights</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-zinc-800/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-500">Best Seller</span>
                  <span className="text-sm font-semibold text-zinc-300">{bestCount}×</span>
                </div>
                <p className="text-sm font-medium text-white truncate">{bestSeller}</p>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-zinc-500 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                  <Zap className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-white">{peakHour}</p>
                  <p className="text-xs text-zinc-500">Peak Hour</p>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                  <Clock className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-white">{settings.averagePrepTime}m</p>
                  <p className="text-xs text-zinc-500">Prep Time</p>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                  <CheckCircle className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-white">{orders.length ? `${Math.round(completed.length / orders.length * 100)}%` : '0%'}</p>
                  <p className="text-xs text-zinc-500">Fulfilled</p>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-3 text-center">
                  <IndianRupee className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-white">{avgValue}</p>
                  <p className="text-xs text-zinc-500">Avg Value</p>
                </div>
              </div>
              <Link href="/admin/analytics" className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-all">
                <span className="text-xs font-medium text-zinc-400">Full Analytics</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </Link>
            </div>
          </div>
        </div>

        {/* Rewards & Points Management */}
        <div className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Rewards &amp; Points</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>₹</span>
                <input
                  type="number"
                  min="1"
                  value={localEarnRate}
                  onChange={(e) => setLocalEarnRate(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-16 px-2 py-1 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-300 text-center focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
                <span>= 1 pt</span>
              </div>
              <button onClick={saveRewards} className="px-3 py-1.5 bg-gold/15 border border-gold/20 text-gold text-xs font-medium rounded-lg hover:bg-gold/25 transition-all">
                Save Changes
              </button>
            </div>
          </div>

          {/* Reward items */}
          <div className="space-y-2">
            {localRewards.map((reward, idx) => (
              <div key={reward.id} className="flex items-center gap-3 bg-zinc-800/30 rounded-lg px-3 py-2.5">
                <span className="text-xs text-zinc-600 w-5 shrink-0 font-mono">{idx + 1}</span>
                <input
                  type="text"
                  value={reward.name}
                  onChange={(e) => updateReward(reward.id, 'name', e.target.value)}
                  placeholder="Reward name"
                  className="flex-1 min-w-0 bg-transparent border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-gold/40"
                />
                <input
                  type="text"
                  value={reward.description}
                  onChange={(e) => updateReward(reward.id, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 min-w-0 bg-transparent border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-gold/40 hidden sm:block"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={reward.cost}
                    onChange={(e) => updateReward(reward.id, 'cost', Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-200 text-center focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  />
                  <span className="text-[10px] text-zinc-600 mr-1">pts</span>
                </div>
                <button
                  onClick={() => updateReward(reward.id, 'available', !reward.available)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                    reward.available
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {reward.available ? 'Active' : 'Off'}
                </button>
                <button onClick={() => removeReward(reward.id)} className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {localRewards.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">No rewards configured. Add one below.</p>
            )}
          </div>

          <button onClick={addReward} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 text-xs font-medium transition-all w-full justify-center">
            <Plus className="w-3.5 h-3.5" />
            Add Reward
          </button>
        </div>

        {/* Seed/Clear */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            {pending > 5 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300"><span className="font-semibold">{pending} orders</span> in queue</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleSeedData} disabled={seeded}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                seeded ? 'bg-zinc-800/30 text-zinc-600 border-zinc-800 cursor-default' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> {seeded ? 'Seeded' : 'Seed Data'}
            </button>
            {confirmClear ? (
              <div className="flex items-center gap-1">
                <button onClick={handleClearData} className="px-3 py-1.5 rounded-lg border bg-red-500/15 text-red-400 border-red-500/25 text-xs font-medium">Confirm</button>
                <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-medium">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-red-400 text-xs font-medium">Clear Data</button>
            )}
          </div>
        </div>

      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmClose(false)} />
          <div className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl w-full max-w-sm p-6 shadow-xl z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Store className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Close Shop?</h3>
              </div>
              <button onClick={() => setConfirmClose(false)} className="p-1 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"><X className="w-3.5 h-3.5" /></button>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              The storefront will be hidden and customers will not be able to place orders. Active orders will continue as normal.
            </p>
            <div className="flex gap-2">
              <button onClick={handleCloseConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500 transition-all">Close Shop</button>
              <button onClick={() => setConfirmClose(false)} className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all">Keep Open</button>
            </div>
          </div>
        </div>
      )}

      {confirmPause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmPause(false)} />
          <div className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl w-full max-w-sm p-6 shadow-xl z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Ban className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Pause Orders?</h3>
              </div>
              <button onClick={() => setConfirmPause(false)} className="p-1 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"><X className="w-3.5 h-3.5" /></button>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              New orders will not be accepted while paused. Existing orders in the pipeline will continue as normal.
            </p>
            <div className="flex gap-2">
              <button onClick={handlePauseConfirm} className="flex-1 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-500 transition-all">Pause Orders</button>
              <button onClick={() => setConfirmPause(false)} className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-all">Keep Accepting</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
