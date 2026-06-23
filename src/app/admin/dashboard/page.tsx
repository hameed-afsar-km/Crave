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
  { label: 'Orders Today', value: 48, icon: ShoppingBag, color: 'from-gold to-amber-600', suffix: '' },
  { label: 'Revenue Today', value: 12450, icon: IndianRupee, color: 'from-green-400 to-emerald-500', suffix: '' },
  { label: 'Pending Orders', value: 12, icon: Clock, color: 'from-yellow-400 to-gold', suffix: '' },
  { label: 'Completed Today', value: 36, icon: CheckCircle, color: 'from-blue-400 to-purple-500', suffix: '' },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Admin access only</p>
          <Link href="/" className="text-gold hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/orders"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gold border border-gray-700 rounded-full hover:border-gold transition-all"
              >
                Orders
              </Link>
              <Link
                href="/admin/menu"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-gold border border-gray-700 rounded-full hover:border-gold transition-all"
              >
                Menu
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-gold to-amber-600 text-white rounded-full hover:shadow-lg transition-all"
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
              className="bg-gray-950 rounded-2xl p-6 border border-gray-800 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} p-2.5 flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <AnimatedCounter value={card.value} suffix={card.suffix} />
              <p className="text-gray-400 text-sm mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-950 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {[
                { id: '#CRV-048', customer: 'Rahul K.', items: 3, amount: 450, status: 'preparing' },
                { id: '#CRV-047', customer: 'Priya S.', items: 2, amount: 330, status: 'ready' },
                { id: '#CRV-046', customer: 'Amit P.', items: 4, amount: 680, status: 'completed' },
                { id: '#CRV-045', customer: 'Divya R.', items: 1, amount: 180, status: 'received' },
              ].map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-100">{order.id}</p>
                    <p className="text-xs text-gray-400">{order.customer} • {order.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₹{order.amount}</p>
                    <span className={`text-xs font-medium capitalize ${
                      order.status === 'completed' ? 'text-green-600' :
                      order.status === 'preparing' ? 'text-yellow-600' :
                      order.status === 'ready' ? 'text-blue-600' : 'text-gold-dark'
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
            className="bg-gray-950 rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/orders"
                className="p-4 bg-gold/10 rounded-xl text-center hover:bg-gold/20 transition-colors"
              >
                <Package className="w-6 h-6 text-gold mx-auto mb-2" />
                <span className="text-sm font-medium text-white">Manage Orders</span>
              </Link>
              <Link
                href="/admin/menu"
                className="p-4 bg-gold/10 rounded-xl text-center hover:bg-gold/20 transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-gold mx-auto mb-2" />
                <span className="text-sm font-medium text-white">Edit Menu</span>
              </Link>
              <Link
                href="/"
                className="p-4 bg-green-500/10 rounded-xl text-center hover:bg-green-500/20 transition-colors"
              >
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-white">View Site</span>
              </Link>
              <Link
                href="/menu"
                className="p-4 bg-blue-500/10 rounded-xl text-center hover:bg-blue-500/20 transition-colors"
              >
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-white">Place Order</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
