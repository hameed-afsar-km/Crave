'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown, CheckCircle, ChefHat, Package, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const statusStyles: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
};

const initialOrders = [
  { id: 'CRV-048', customer: 'Rahul Kumar', items: [{ name: 'Chicken Shawarma', qty: 2 }, { name: 'Fries', qty: 1 }], amount: 480, pickupTime: '18:30', status: 'preparing' as const },
  { id: 'CRV-047', customer: 'Priya Sharma', items: [{ name: 'Beef Burger', qty: 1 }, { name: 'Lemon Mint', qty: 1 }], amount: 330, pickupTime: '18:15', status: 'ready' as const },
  { id: 'CRV-046', customer: 'Amit Patel', items: [{ name: 'Chicken Combo', qty: 1 }, { name: 'Brownie Sundae', qty: 1 }], amount: 550, pickupTime: '18:00', status: 'completed' as const },
  { id: 'CRV-045', customer: 'Divya Rajan', items: [{ name: 'Chicken Shawarma', qty: 1 }], amount: 180, pickupTime: '18:45', status: 'received' as const },
  { id: 'CRV-044', customer: 'Vikram Singh', items: [{ name: 'Veg Shawarma', qty: 2 }, { name: 'Fries', qty: 1 }, { name: 'Chocolate Milkshake', qty: 1 }], amount: 530, pickupTime: '19:00', status: 'received' as const },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-500 mt-1">Manage and update order status</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-300 bg-white"
            >
              <option value="all">All Status</option>
              <option value="received">Received</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Items</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Pickup</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-sm text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{order.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.items.map((item, idx) => (
                        <span key={idx}>{item.qty}x {item.name}{idx < order.items.length - 1 ? ', ' : ''}</span>
                      ))}
                    </td>
                    <td className="px-6 py-4 font-semibold text-sm">₹{order.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.pickupTime}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {order.status === 'received' && (
                          <button onClick={() => updateStatus(order.id, 'preparing')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Start Preparing">
                            <ChefHat className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button onClick={() => updateStatus(order.id, 'ready')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Mark Ready">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button onClick={() => updateStatus(order.id, 'completed')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Mark Completed">
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                        {order.status !== 'completed' && order.status !== 'received' || (
                          <span className="text-xs text-gray-400 px-2 py-2">
                            {order.status === 'received' ? 'Awaiting' : 'Done'}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No orders found</div>
          )}
        </div>
      </div>
    </div>
  );
}
