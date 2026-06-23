'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Package, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const pastOrders = [
  { id: 'CRV-001', date: '2024-01-15', items: 3, total: 450, status: 'completed' },
  { id: 'CRV-002', date: '2024-01-10', items: 2, total: 380, status: 'completed' },
  { id: 'CRV-003', date: '2024-01-05', items: 4, total: 720, status: 'completed' },
];

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-950 rounded-3xl p-8 border border-gray-800 shadow-sm mb-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{user.name || 'Customer'}</h1>
              <p className="text-gray-400">{user.email || 'No email'}</p>
            </div>
            <button
              onClick={signOut}
              className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 bg-black rounded-xl">
              <Phone className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="font-medium text-white">{user.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-black rounded-xl">
              <Mail className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="font-medium text-white">{user.email || 'Not set'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-950 rounded-3xl p-8 border border-gray-800 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Past Orders</h2>
          </div>

          {pastOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {pastOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-black rounded-xl hover:bg-orange-500/5 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-white">{order.id}</p>
                    <p className="text-sm text-gray-400">{order.date} • {order.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₹{order.total}</p>
                    <span className="text-xs text-green-400 font-medium">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
