'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Package, LogOut, ArrowLeft, Star, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { subscribeCustomerOrders, getLoyaltyPoints } from '@/lib/firestore-service';

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeCustomerOrders(user.uid, (firestoreOrders) => {
        setPastOrders(firestoreOrders);
      });
      getLoyaltyPoints(user.uid).then((points) => {
        setLoyaltyPoints(points);
      });
      return unsub;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  const totalSpent = pastOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
  const totalOrders = pastOrders.length;

  return (
    <div className="min-h-screen bg-[#06060A] pt-32 md:pt-40 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        {/* Profile hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[28px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6 md:p-8 mb-5 relative overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_65%)] rounded-full pointer-events-none" />

          {/* User header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-white/5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-xl shadow-gold/15 border border-white/10">
                <User className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#06060A] shadow-md" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user.name || 'Customer'}</h1>
              <p className="text-zinc-500 text-sm mt-1">{user.email || 'No email linked'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2.5">
                <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                <span className="text-xs font-bold text-zinc-400">Loyal customer</span>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/8 rounded-xl transition-all border border-transparent hover:border-red-500/15"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-6">
            {[
              { label: 'Total Orders', value: totalOrders, icon: ShoppingBag },
              { label: 'Amount Spent', value: `₹${totalSpent}`, icon: Package },
              { label: 'Loyalty Points', value: `${loyaltyPoints} pts`, icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-4 rounded-2xl bg-black/30 border border-white/5">
                <Icon className="w-4 h-4 text-gold mb-2" />
                <p className="text-lg font-black text-white">{value}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Contact fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
            {[
              { icon: Phone, label: 'Phone', value: user.phone || 'Not configured' },
              { icon: Mail, label: 'Email', value: user.email || 'Not configured' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3.5 p-4 bg-black/30 border border-white/5 rounded-2xl">
                <div className="p-2 bg-gold/8 rounded-xl border border-gold/15 shrink-0">
                  <Icon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
                  <p className="font-bold text-zinc-200 text-sm mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order history */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="rounded-[28px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6 md:p-8"
        >
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gold/8 border border-gold/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-gold" />
            </div>
            <h2 className="text-base font-black text-white">Order History</h2>
          </div>

          {pastOrders.length === 0 ? (
            <p className="text-zinc-600 text-center py-10 font-semibold text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {pastOrders.map((order: any, i: number) => {
                const date = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '';
                const itemsCount = order.items?.length || 0;
                const status = order.status || 'received';

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                  >
                    <Link
                      href={`/order/${order.id}`}
                      className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-2xl hover:border-gold/20 hover:bg-gold/[0.02] transition-all duration-300 group"
                    >
                      <div>
                        <p className="font-black text-white text-sm group-hover:text-gold transition-colors">#{order.id}</p>
                        <p className="text-xs text-zinc-600 mt-0.5 font-semibold">{date}{itemsCount > 0 ? ` · ${itemsCount} item${itemsCount > 1 ? 's' : ''}` : ''}</p>
                      </div>
                      <div className="text-right">
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
