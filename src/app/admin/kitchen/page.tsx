'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CookingPot, Clock, Phone, AlertTriangle, ChefHat, CheckCircle, Package, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { subscribeOrders, updateOrderStatus as firestoreUpdateStatus } from '@/lib/firestore-service';

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
  outletId?: string;
  outletName?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string; next: string | null; nextAction: string | null }> = {
  received: { label: 'Received', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500', next: 'preparing', nextAction: 'Start' },
  preparing: { label: 'Preparing', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', next: 'ready', nextAction: 'Ready' },
  ready: { label: 'Ready', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', next: 'completed', nextAction: 'Collect' },
  completed: { label: 'Collected', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-700', dot: 'bg-zinc-600', next: null, nextAction: null },
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
  const { canManageKitchen, isMasterAdmin, user } = useAuth();
  const { selectedOutletId, outlets, setSelectedOutletId, isAllOutlets } = useAdminOutlet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const outletFilter = !isAllOutlets && selectedOutletId ? selectedOutletId : undefined;
    const unsub = subscribeOrders((firestoreOrders) => {
      const mapped = firestoreOrders.map((o: any) => ({
        id: o.id,
        customer: o.customerName || '',
        phone: o.customerPhone || '',
        items: o.items || [],
        amount: o.amount || 0,
        pickupTime: o.pickupTime || '',
        status: o.status || 'received',
        notes: o.notes || '',
        createdAt: o.createdAt || new Date().toISOString(),
        outletId: o.outletId || '',
        outletName: o.outletName || '',
      }));
      setOrders(mapped);
    }, [], outletFilter);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => { unsub(); clearInterval(timer); };
  }, [selectedOutletId, isAllOutlets]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const updateStatus = (orderId: string, newStatus: Order['status']) => {
    firestoreUpdateStatus(orderId, newStatus, undefined, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const outletFiltered = useMemo(() => {
    return isAllOutlets ? orders : orders.filter(o => o.outletId === selectedOutletId);
  }, [orders, selectedOutletId, isAllOutlets]);

  const filtered = useMemo(() => {
    return outletFiltered
      .filter(o => o.status !== 'completed')
      .filter(o => filter === 'all' || o.status === filter)
      .sort((a, b) => {
        const pa = getPriority(a, nowMinutes);
        const pb = getPriority(b, nowMinutes);
        const rank = { late: 0, urgent: 1, upcoming: 2, normal: 3 };
        if (rank[pa] !== rank[pb]) return rank[pa] - rank[pb];
        return a.pickupTime.localeCompare(b.pickupTime);
      });
  }, [outletFiltered, filter, nowMinutes]);

  const counts = useMemo(() => ({
    all: outletFiltered.filter(o => o.status !== 'completed').length,
    received: outletFiltered.filter(o => o.status === 'received').length,
    preparing: outletFiltered.filter(o => o.status === 'preparing').length,
    ready: outletFiltered.filter(o => o.status === 'ready').length,
  }), [outletFiltered]);

  if (!canManageKitchen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <div className="bg-[#0D0D14] border-b border-zinc-800/60">
        <div className="px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                <CookingPot className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Kitchen</h1>
                <p className="text-xs text-zinc-500">
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
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {tab === 'all' ? 'All' : statusConfig[tab].label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    filter === tab ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    {counts[tab as keyof typeof counts]}
                  </span>
                </button>
              ))}
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
                  {outletFiltered.filter(o => o.status !== 'completed').length}
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
                    {orders.filter((o: any) => o.outletId === outlet.id && o.status !== 'completed').length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kitchen grid */}
      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <CookingPot className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium text-sm">No active orders</p>
            <p className="text-zinc-600 text-xs mt-1">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((order, i) => {
              const priority = getPriority(order, nowMinutes);
              const sc = statusConfig[order.status];
              const priorityBorder = priority === 'late' ? 'border-red-500/30' : priority === 'urgent' ? 'border-amber-500/30' : priority === 'upcoming' ? 'border-blue-500/30' : 'border-zinc-800/60';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-[#12121A] rounded-xl border ${priorityBorder} transition-all duration-200 overflow-hidden`}
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
                          <span className="font-bold text-sm text-white">{order.id}</span>
                          {priority === 'late' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                        <p className="text-sm text-zinc-400 mt-0.5">{order.customer}</p>
                        {isMasterAdmin && order.outletName && (
                          <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />{order.outletName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {timeSince(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-medium text-zinc-300">{order.pickupTime}</span>
                      {priority === 'late' && <span className="text-[10px] font-semibold text-red-400">Late</span>}
                      {priority === 'urgent' && <span className="text-[10px] font-semibold text-amber-400">Soon</span>}
                    </div>

                    <div className="space-y-1 mb-3 bg-zinc-800/30 rounded-lg p-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-zinc-400 text-xs">{item.qty}×</span>
                          <span className="text-zinc-300">{item.name}</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mb-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                        {order.notes}
                      </div>
                    )}

                    {order.status !== 'completed' && (
                      <div className="flex gap-2">
                        {order.status === 'received' && (
                          <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-lg transition-all">
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
                        <a href={`tel:${order.phone}`} className="flex items-center justify-center w-10 py-2.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
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
