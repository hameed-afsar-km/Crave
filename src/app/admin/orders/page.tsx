'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Search, ChefHat, Package, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  received: { label: 'Received', pill: 'bg-blue-500/8 text-blue-400 border border-blue-500/15', dot: 'bg-blue-400' },
  preparing: { label: 'Preparing', pill: 'bg-amber-500/8 text-amber-400 border border-amber-500/15', dot: 'bg-amber-400' },
  ready: { label: 'Ready ✓', pill: 'bg-emerald-500/8 text-emerald-400 border border-emerald-500/15', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', pill: 'bg-zinc-800/30 text-zinc-500 border border-white/5', dot: 'bg-zinc-600' },
};

const initialOrders = [
  { id: 'CRV-048', customer: 'Rahul Kumar', items: [{ name: 'Chicken Shawarma', qty: 2 }, { name: 'Fries', qty: 1 }], amount: 480, pickupTime: '18:30', status: 'preparing' as const },
  { id: 'CRV-047', customer: 'Priya Sharma', items: [{ name: 'Beef Burger', qty: 1 }, { name: 'Lemon Mint', qty: 1 }], amount: 330, pickupTime: '18:15', status: 'ready' as const },
  { id: 'CRV-046', customer: 'Amit Patel', items: [{ name: 'Chicken Combo', qty: 1 }, { name: 'Brownie Sundae', qty: 1 }], amount: 550, pickupTime: '18:00', status: 'completed' as const },
  { id: 'CRV-045', customer: 'Divya Rajan', items: [{ name: 'Chicken Shawarma', qty: 1 }], amount: 180, pickupTime: '18:45', status: 'received' as const },
  { id: 'CRV-044', customer: 'Vikram Singh', items: [{ name: 'Veg Shawarma', qty: 2 }, { name: 'Fries', qty: 1 }], amount: 530, pickupTime: '19:00', status: 'received' as const },
  { id: 'CRV-043', customer: 'Ananya Patel', items: [{ name: 'Chicken Burger', qty: 2 }], amount: 400, pickupTime: '19:15', status: 'preparing' as const },
];

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const updateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  const filterTabs = ['all', 'received', 'preparing', 'ready', 'completed'];

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Page header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-gold/22 text-zinc-400 hover:text-gold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Order Management</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Manage and track live customer orders</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 input-dark rounded-xl text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 relative z-10">
        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-7 [scrollbar-width:none]">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                statusFilter === tab
                  ? 'bg-gold/10 text-gold border-gold/22'
                  : 'bg-white/3 text-zinc-600 border-white/5 hover:text-zinc-300 hover:border-white/10'
              }`}
            >
              {tab === 'all' ? 'All Orders' : tab}
            </button>
          ))}
        </div>

        {/* Orders table */}
        <div className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05] bg-black/30">
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Pickup', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const sc = statusConfig[order.status];
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/[0.04] hover:bg-gold/[0.015] transition-colors group"
                    >
                      <td className="px-5 py-4 font-black text-sm text-white">{order.id}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">{order.customer}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500 max-w-[200px]">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="inline-block">
                            <span className="text-gold font-black">{item.qty}×</span> {item.name}
                            {idx < order.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </td>
                      <td className="px-5 py-4 font-black text-sm text-zinc-200">₹{order.amount}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gold/50" />
                          {order.pickupTime}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sc.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {order.status === 'received' && (
                            <button
                              onClick={() => updateStatus(order.id, 'preparing')}
                              title="Start Preparing"
                              className="p-2 text-amber-400 border border-amber-500/12 hover:border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/12 rounded-xl transition-all"
                            >
                              <ChefHat className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateStatus(order.id, 'ready')}
                              title="Mark Ready"
                              className="p-2 text-emerald-400 border border-emerald-500/12 hover:border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/12 rounded-xl transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => updateStatus(order.id, 'completed')}
                              title="Mark Collected"
                              className="p-2 text-zinc-400 border border-white/8 hover:border-white/18 bg-white/4 hover:bg-white/8 rounded-xl transition-all"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <span className="px-2 py-2 text-[10px] text-zinc-700 font-black uppercase tracking-wider">Done</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-zinc-600 font-black text-sm uppercase tracking-wider">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
