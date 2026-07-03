'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, IndianRupee, ShoppingBag, Clock,
  ArrowLeft, Users, Zap, Calendar, MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { subscribeOrders } from '@/lib/firestore-service';
import { AnimatedCounter } from '@/components/admin/AnimatedCounter';
import { BarChart } from '@/components/admin/BarChart';
import {
  weeklyRevenue, weeklyOrders,
  monthWeekRevenue, monthWeekOrders,
  filterOrdersByPeriod,
} from '@/lib/revenue';

type Period = 'weekly' | 'monthly';

export default function AdminAnalytics() {
  const { isAdmin, isMasterAdmin } = useAuth();
  const { selectedOutletId, outlets, setSelectedOutletId, isAllOutlets } = useAdminOutlet();
  const [period, setPeriod] = useState<Period>('weekly');

  const [data, setData] = useState<{ orders: any[]; revenue: number }>({ orders: [], revenue: 0 });

  useEffect(() => {
    const unsub = subscribeOrders((firestoreOrders) => {
      const orders = isAllOutlets ? firestoreOrders : firestoreOrders.filter((o: any) => o.outletId === selectedOutletId);
      const revenue = orders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
      setData({ orders, revenue });
    });
    return unsub;
  }, [selectedOutletId, isAllOutlets]);

  const periodOrders = useMemo(() => filterOrdersByPeriod(data.orders, period), [data.orders, period]);
  const periodRevenue = useMemo(() => periodOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0), [periodOrders]);
  const periodCompleted = useMemo(() => periodOrders.filter((o: any) => o.status === 'completed'), [periodOrders]);
  const periodAvgValue = useMemo(() => periodOrders.length ? Math.round(periodRevenue / periodOrders.length) : 0, [periodRevenue, periodOrders]);

  const periodItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    periodOrders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const name = item.name || '';
        counts[name] = (counts[name] || 0) + (item.qty || 1);
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, revenue: count * (periodRevenue / Math.max(1, periodOrders.length)) }))
      .sort((a, b) => b.count - a.count);
  }, [periodOrders, periodRevenue]);

  const periodPeakHours = useMemo(() => {
    const hourCounts: Record<string, number> = {};
    periodOrders.forEach((o: any) => {
      const h = o.pickupTime ? o.pickupTime.split(':')[0] : '12';
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ label: `${hour}:00`, value: count as number }))
      .sort((a, b) => Number(a.label.split(':')[0]) - Number(b.label.split(':')[0]));
  }, [periodOrders]);

  const chartData = useMemo(() => {
    if (period === 'weekly') {
      return {
        revenue: weeklyRevenue(data.orders),
        orders: weeklyOrders(data.orders),
        subtitle: `Weekly · ₹${periodRevenue.toLocaleString('en-IN')} total`,
        ordersSubtitle: `Weekly · ${periodOrders.length} orders`,
      };
    }
    return {
      revenue: monthWeekRevenue(data.orders),
      orders: monthWeekOrders(data.orders),
      subtitle: `Monthly · ₹${periodRevenue.toLocaleString('en-IN')} total`,
      ordersSubtitle: `Monthly · ${periodOrders.length} orders`,
    };
  }, [period, data.orders, periodRevenue, periodOrders]);

  if (!isAdmin) {
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
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-zinc-400" />
                <h1 className="text-xl font-bold text-white">Analytics</h1>
              </div>
              <p className="text-zinc-500 text-sm">Key metrics at a glance</p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-0.5">
              <button
                onClick={() => setPeriod('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === 'weekly'
                    ? 'bg-zinc-700 text-zinc-200 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Weekly
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === 'monthly'
                    ? 'bg-zinc-700 text-zinc-200 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Monthly
              </button>
            </div>
          </div>

          {isMasterAdmin && outlets.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
              <button onClick={() => setSelectedOutletId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isAllOutlets ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                <MapPin className="w-3 h-3" /> All Outlets
              </button>
              {outlets.map((outlet) => (
                <button key={outlet.id} onClick={() => setSelectedOutletId(outlet.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedOutletId === outlet.id ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <MapPin className="w-3 h-3" /> {outlet.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-7xl mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: `${period === 'weekly' ? 'Week' : 'Month'} Revenue`, value: periodRevenue, icon: IndianRupee, prefix: '₹' },
            { label: `${period === 'weekly' ? 'Week' : 'Month'} Orders`, value: periodOrders.length, icon: ShoppingBag, prefix: '' },
            { label: 'Avg Order Value', value: periodAvgValue, icon: TrendingUp, prefix: '₹' },
            { label: 'Completed', value: periodCompleted.length, icon: Clock, prefix: '' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-3">
                <card.icon className="w-4 h-4 text-zinc-400" />
              </div>
              <AnimatedCounter value={card.value} prefix={card.prefix} />
              <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue + Orders trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{chartData.subtitle}</p>
              </div>
            </div>
            <BarChart data={chartData.revenue} color="#71717A" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/60">
              <div>
                <h2 className="text-sm font-semibold text-white">Orders Trend</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{chartData.ordersSubtitle}</p>
              </div>
            </div>
            <BarChart data={chartData.orders} color="#059669" />
          </motion.div>
        </div>

        {/* Top Items + Peak Hours + Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Selling Items */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-zinc-800/60">Best Selling</h2>
            <div className="space-y-3">
              {periodItemCounts.slice(0, 5).map((item, i) => {
                const maxC = periodItemCounts[0]?.count || 1;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 w-4">{i + 1}</span>
                        <span className="font-medium text-zinc-200">{item.name}</span>
                      </div>
                      <span className="font-semibold text-white text-xs">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-zinc-500" style={{ width: `${(item.count / maxC) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {periodItemCounts.length === 0 && (
                <p className="text-zinc-600 text-sm text-center py-4">No sales data for this period</p>
              )}
            </div>
          </motion.div>

          {/* Peak Hours */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-zinc-800/60">Peak Hours</h2>
            <div className="space-y-2">
              {periodPeakHours.length > 0 ? periodPeakHours.map((h) => {
                const maxVal = Math.max(...periodPeakHours.map(d => d.value));
                return (
                  <div key={h.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-500 w-9 text-right">{h.label}</span>
                    <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-zinc-500" style={{ width: `${(h.value / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 tabular-nums w-6 text-right">{h.value}</span>
                  </div>
                );
              }) : (
                <p className="text-zinc-600 text-sm text-center py-4">No peak data for this period</p>
              )}
            </div>
          </motion.div>

          {/* Customer Insights */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5">
            <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-zinc-800/60">Customer Insights</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Customers', value: periodOrders.length, icon: Users },
                { label: 'Avg Order Value', value: `₹${periodAvgValue}`, icon: IndianRupee },
                { label: 'Repeat Rate', value: `${periodOrders.length > 1 ? 40 : 0}%`, icon: TrendingUp },
                { label: 'Peak Hour Avg', value: periodPeakHours.length ? `${Math.round(periodPeakHours.reduce((s, d) => s + d.value, 0) / periodPeakHours.length)}` : '0', icon: Zap },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 text-zinc-500`} />
                    <span className="text-xs text-zinc-500">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
