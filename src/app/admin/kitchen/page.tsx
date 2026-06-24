'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CookingPot, Clock, Phone, AlertTriangle, ChefHat, CheckCircle, Package } from 'lucide-react';
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
  received: { label: 'Received', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', next: 'preparing', nextAction: 'Start' },
  preparing: { label: 'Preparing', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', next: 'ready', nextAction: 'Ready' },
  ready: { label: 'Ready', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', next: 'completed', nextAction: 'Collect' },
  completed: { label: 'Collected', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100', dot: 'bg-gray-300', next: null, nextAction: null },
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <CookingPot className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Kitchen</h1>
                <p className="text-xs text-gray-500">
                  {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{filtered.length} active
                </p>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    filter === tab
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'all' ? 'All' : statusConfig[tab].label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    filter === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
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
      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <CookingPot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">No active orders</p>
            <p className="text-gray-400 text-xs mt-1">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((order, i) => {
              const priority = getPriority(order, nowMinutes);
              const sc = statusConfig[order.status];
              const priorityBorder = priority === 'late' ? 'border-red-300' : priority === 'urgent' ? 'border-amber-300' : priority === 'upcoming' ? 'border-blue-200' : 'border-gray-100';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white rounded-xl border ${priorityBorder} shadow-sm hover:shadow transition-all duration-200 overflow-hidden`}
                >
                  {/* Priority indicator */}
                  {priority !== 'normal' && (
                    <div className={`h-0.5 ${
                      priority === 'late' ? 'bg-red-500' : priority === 'urgent' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{order.id}</span>
                          {priority === 'late' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{order.customer}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {timeSince(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{order.pickupTime}</span>
                      {priority === 'late' && <span className="text-[10px] font-semibold text-red-600">Late</span>}
                      {priority === 'urgent' && <span className="text-[10px] font-semibold text-amber-600">Soon</span>}
                    </div>

                    <div className="space-y-1 mb-3 bg-gray-50 rounded-lg p-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-500 text-xs">{item.qty}×</span>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        {order.notes}
                      </div>
                    )}

                    {order.status !== 'completed' && (
                      <div className="flex gap-2">
                        {order.status === 'received' && (
                          <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs rounded-lg transition-all">
                            <ChefHat className="w-3.5 h-3.5" /> Start
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-all">
                            <CheckCircle className="w-3.5 h-3.5" /> Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-all">
                            <Package className="w-3.5 h-3.5" /> Collect
                          </button>
                        )}
                        <a href={`tel:${order.phone}`} className="flex items-center justify-center w-10 py-2.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
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
