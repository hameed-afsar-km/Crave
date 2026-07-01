'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, ArrowLeft, Clock, ChefHat, CheckCircle, MapPin, Flame, Receipt, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { subscribeCustomerOrders } from '@/lib/firestore-service';

const statusIcons: Record<string, React.ReactNode> = {
  received: <Clock className="w-3.5 h-3.5" />,
  preparing: <ChefHat className="w-3.5 h-3.5" />,
  ready: <CheckCircle className="w-3.5 h-3.5" />,
  completed: <MapPin className="w-3.5 h-3.5" />,
  cancelled: <X className="w-3.5 h-3.5" />,
};

const statusColors: Record<string, string> = {
  received: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/15',
  preparing: 'text-blue-400 bg-blue-400/8 border-blue-400/15',
  ready: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/15',
  completed: 'text-zinc-500 bg-zinc-500/8 border-zinc-500/15',
  cancelled: 'text-red-400 bg-red-400/8 border-red-400/15',
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeCustomerOrders(user.uid, (firestoreOrders) => {
      setOrders(firestoreOrders);
    });
    return unsub;
  }, [user?.uid]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#06060A] pt-28 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[28px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6 md:p-8"
        >
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gold/8 border border-gold/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-gold" />
            </div>
            <h1 className="text-base font-black text-white">My Orders</h1>
            {orders.length > 0 && (
              <span className="ml-auto text-xs font-bold text-zinc-600">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-600 font-bold text-sm">No orders yet</p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gold/10 border border-gold/15 text-gold rounded-2xl font-bold text-sm hover:bg-gold/15 transition-all"
              >
                <Flame className="w-4 h-4" />
                Place your first order
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => {
                const status = order.status || 'received';
                const itemCount = order.items?.length || 0;
                const date = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '';

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={`/order/${order.id}`}
                      className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-2xl hover:border-gold/20 hover:bg-gold/[0.02] transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${statusColors[status] || statusColors.received}`}>
                          {statusIcons[status] || statusIcons.received}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-white text-sm group-hover:text-gold transition-colors truncate">
                            #{order.id}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5 font-semibold truncate">
                            {date}{itemCount > 0 ? ` · ${itemCount} item${itemCount > 1 ? 's' : ''}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-black text-white">₹{order.amount}</p>
                        <span className={`text-[10px] font-black uppercase tracking-wider block mt-0.5 ${status === 'cancelled' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {status === 'completed' ? '✓ Collected' : status === 'cancelled' ? 'Cancelled' : status}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
