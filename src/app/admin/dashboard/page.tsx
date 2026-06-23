'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, IndianRupee, Clock, CheckCircle, TrendingUp, Package, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);

  return (
    <span ref={ref} className="text-3xl font-bold">
      {count}{suffix}
    </span>
  );
}

const statsCards = [
  { label: 'Orders Today', value: 48, icon: ShoppingBag, color: 'from-orange-400 to-red-500', suffix: '' },
  { label: 'Revenue Today', value: 12450, icon: IndianRupee, color: 'from-green-400 to-emerald-500', suffix: '' },
  { label: 'Pending Orders', value: 12, icon: Clock, color: 'from-yellow-400 to-orange-500', suffix: '' },
  { label: 'Completed Today', value: 36, icon: CheckCircle, color: 'from-blue-400 to-purple-500', suffix: '' },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">Admin access only</p>
          <Link href="/" className="text-orange-500 hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/orders"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 border border-gray-200 rounded-full hover:border-orange-300 transition-all"
              >
                Orders
              </Link>
              <Link
                href="/admin/menu"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 border border-gray-200 rounded-full hover:border-orange-300 transition-all"
              >
                Menu
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:shadow-lg transition-all"
              >
                View Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} p-2.5 flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <AnimatedCounter value={card.value} suffix={card.suffix} />
              <p className="text-gray-500 text-sm mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {[
                { id: '#CRV-048', customer: 'Rahul K.', items: 3, amount: 450, status: 'preparing' },
                { id: '#CRV-047', customer: 'Priya S.', items: 2, amount: 330, status: 'ready' },
                { id: '#CRV-046', customer: 'Amit P.', items: 4, amount: 680, status: 'completed' },
                { id: '#CRV-045', customer: 'Divya R.', items: 1, amount: 180, status: 'received' },
              ].map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{order.id}</p>
                    <p className="text-xs text-gray-500">{order.customer} • {order.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₹{order.amount}</p>
                    <span className={`text-xs font-medium capitalize ${
                      order.status === 'completed' ? 'text-green-600' :
                      order.status === 'preparing' ? 'text-yellow-600' :
                      order.status === 'ready' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/orders"
                className="p-4 bg-orange-50 rounded-xl text-center hover:bg-orange-100 transition-colors"
              >
                <Package className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Manage Orders</span>
              </Link>
              <Link
                href="/admin/menu"
                className="p-4 bg-orange-50 rounded-xl text-center hover:bg-orange-100 transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Edit Menu</span>
              </Link>
              <Link
                href="/"
                className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition-colors"
              >
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">View Site</span>
              </Link>
              <Link
                href="/menu"
                className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-colors"
              >
                <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Place Order</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
