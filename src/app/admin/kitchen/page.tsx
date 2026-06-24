'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CookingPot, Clock, Phone, AlertTriangle, ChevronRight, ChefHat, CheckCircle, Package, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStoredOrders, saveOrders } from '@/lib/seed-data';

interface OrderItem {
  name: string;
  qty: number;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  amount: number;
  pickupTime: string;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  notes?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string; next: string | null; nextAction: string | null }> = {
  received: { label: 'Received', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400', next: 'preparing', nextAction: 'Start Preparing' },
  preparing: { label: 'Preparing', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400', next: 'ready', nextAction: 'Mark Ready' },
  ready: { label: 'Ready ✓', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400', next: 'completed', nextAction: 'Collected' },
  completed: { label: 'Collected', color: 'text-zinc-600', bg: 'bg-zinc-800/30', border: 'border-zinc-700/20', dot: 'bg-zinc-600', next: null, nextAction: null },
};

function timeSince(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function getPriority(order: Order, nowMinutes: number): 'late' | 'urgent' | 'upcoming' | 'normal' {
  if (order.status === 'completed') return 'normal';
  const [h, m] = order.pickupTime.split(':').map(Number);
  const pickupMinutes = h * 60 + m;
  const diff = pickupMinutes - nowMinutes;
  if (diff < 0) return 'late';
  if (diff <= 10) return 'urgent';
  if (diff <= 20) return 'upcoming';
  return 'normal';
}

const filterTabs = ['all', 'received', 'preparing', 'ready'] as const;

export default function KitchenPage() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const stored = getStoredOrders();
    if (stored) setOrders(stored);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const updateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      saveOrders(updated);
      return updated;
    });
  };

  const filtered = useMemo(() => {
    return orders
      .filter(o => o.status !== 'completed')
      .filter(o => filter === 'all' || o.status === filter)
      .sort((a, b) => {
        const pa = getPriority(a, nowMinutes);
        const pb = getPriority(b, nowMinutes);
        const rank = { late: 0, urgent: 1, upcoming: 2, normal: 3 };
        if (rank[pa] !== rank[pb]) return rank[pa] - rank[pb];
        return a.pickupTime.localeCompare(b.pickupTime);
      });
  }, [orders, filter, nowMinutes]);

  const counts = useMemo(() => ({
    all: orders.filter(o => o.status !== 'completed').length,
    received: orders.filter(o => o.status === 'received').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }), [orders]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,175,55,0.03)_0%,transparent_65%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <CookingPot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kitchen</h1>
                <p className="text-[10px] text-zinc-500 font-bold">
                  {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{filtered.length} active
                </p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    filter === tab
                      ? 'bg-gold/10 text-gold border-gold/22'
                      : 'bg-white/3 text-zinc-600 border-white/5 hover:text-zinc-300 hover:border-white/10'
                  }`}
                >
                  {tab === 'all' ? 'All' : statusConfig[tab].label}
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                    filter === tab ? 'bg-gold/20 text-gold' : 'bg-white/5 text-zinc-600'
                  }`}>
                    {counts[tab as keyof typeof counts]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kitchen grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <CookingPot className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 font-black text-sm uppercase tracking-wider">No active orders</p>
            <p className="text-zinc-700 text-xs font-semibold mt-1">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((order, i) => {
              const priority = getPriority(order, nowMinutes);
              const sc = statusConfig[order.status];
              const priorityBorder = priority === 'late' ? 'border-rose-500/40' : priority === 'urgent' ? 'border-amber-500/30' : priority === 'upcoming' ? 'border-blue-500/20' : 'border-white/[0.06]';
              const priorityGlow = priority === 'late' ? 'shadow-[0_0_20px_rgba(244,63,94,0.12)]' : priority === 'urgent' ? 'shadow-[0_0_20px_rgba(245,158,11,0.08)]' : '';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`relative rounded-[20px] bg-[rgba(10,9,18,0.7)] backdrop-blur-lg border ${priorityBorder} ${priorityGlow} hover:border-white/[0.12] transition-all duration-300 overflow-hidden`}
                >
                  {/* Priority bar */}
                  {priority !== 'normal' && (
                    <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                      priority === 'late' ? 'bg-rose-500' : priority === 'urgent' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                  )}

                  <div className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-white">{order.id}</span>
                          {priority === 'late' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        </div>
                        <p className="text-sm font-semibold text-zinc-400 mt-0.5">{order.customer}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-600 tabular-nums">
                          <Clock className="w-3 h-3 inline mr-0.5 text-zinc-700" />
                          {timeSince(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Pickup time */}
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <Clock className="w-3.5 h-3.5 text-gold/50" />
                      <span className="font-bold text-zinc-300">Pickup {order.pickupTime}</span>
                      {priority === 'late' && (
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Late</span>
                      )}
                      {priority === 'urgent' && (
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Soon</span>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-4 bg-black/30 rounded-xl p-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-black text-gold text-xs">{item.qty}×</span>
                          <span className="font-semibold text-zinc-200">{item.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mb-4 text-xs text-amber-300/80 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2 font-semibold">
                        📝 {order.notes}
                      </div>
                    )}

                    {/* Action buttons */}
                    {order.status !== 'completed' && (
                      <div className="flex gap-2">
                        {order.status === 'received' && (
                          <button
                            onClick={() => updateStatus(order.id, 'preparing')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 hover:scale-[1.02] transition-all duration-200"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            Start
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateStatus(order.id, 'ready')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all duration-200"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateStatus(order.id, 'completed')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-blue-400 to-violet-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 hover:scale-[1.02] transition-all duration-200"
                          >
                            <Package className="w-3.5 h-3.5" />
                            Collect
                          </button>
                        )}
                        <a
                          href={`tel:${order.phone}`}
                          className="flex items-center justify-center w-11 py-3 rounded-xl border border-white/8 hover:border-gold/22 bg-white/3 hover:bg-gold/5 text-zinc-400 hover:text-gold transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
