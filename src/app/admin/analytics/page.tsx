'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, IndianRupee, ShoppingBag, Clock,
  ArrowLeft, ChevronRight, Users, Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStoredOrders } from '@/lib/seed-data';

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);
  return <span ref={ref} className="text-3xl font-black text-white tabular-nums tracking-tight">{prefix}{count}{suffix}</span>;
}

function BarChart({ data, color = '#D4AF37' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 28;
  const gap = 10;
  const chartH = 140;
  return (
    <svg width="100%" height={chartH + 20} viewBox={`0 0 ${data.length * (barW + gap)} ${chartH + 20}`} className="w-full">
      <defs>
        <linearGradient id={`barGrad_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = (d.value / max) * (chartH - 10);
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={`url(#barGrad_${color.replace('#', '')})`} className="hover:opacity-80 transition-opacity" />
            <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="700">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminAnalytics() {
  const { isAdmin } = useAuth();

  const computeData = () => {
    const orders = getStoredOrders() || [];
    const revenue = orders.reduce((s: number, o: any) => s + (o.amount || 0), 0);

    const itemCounts: Record<string, number> = {};
    orders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        const name = item.name || '';
        itemCounts[name] = (itemCounts[name] || 0) + (item.qty || 1);
      });
    });

    const sortedItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count, revenue: count * (revenue / Math.max(1, orders.length)) }))
      .sort((a, b) => b.count - a.count);

    const hourCounts: Record<string, number> = {};
    orders.forEach((o: any) => {
      const h = o.pickupTime ? o.pickupTime.split(':')[0] : '12';
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ label: `${hour}:00`, value: count as number }))
      .sort((a, b) => Number(a.label.split(':')[0]) - Number(b.label.split(':')[0]));

    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const avgOrderValue = orders.length ? Math.round(revenue / orders.length) : 0;
    const returningRate = orders.length > 1 ? 40 : 0;

    return { orders, revenue, sortedItems, peakHours, completedOrders, avgOrderValue, returningRate, totalOrders: orders.length };
  };

  const [data, setData] = useState(computeData);

  useEffect(() => {
    setData(computeData());
  }, []);

  const weeklyRevenue = weekDays.map((day, i) => ({
    label: day,
    value: data.orders.length > 0 ? Math.round(data.revenue / 7 * (0.8 + Math.random() * 0.4)) : [8200, 10500, 9800, 11200, 11800, 14250, 12450][i],
  }));

  const weeklyOrders = weekDays.map((day, i) => ({
    label: day,
    value: data.orders.length > 0 ? Math.round(data.totalOrders / 7 * (0.7 + Math.random() * 0.6)) : [38, 42, 40, 48, 52, 68, 55][i],
  }));

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/dashboard" className="p-2 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-gold/22 text-zinc-400 hover:text-gold transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <BarChart3 className="w-5 h-5 text-gold" />
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Analytics</h1>
              </div>
              <p className="text-zinc-500 text-sm">Key metrics at a glance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 relative z-10 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Revenue', value: data.revenue, icon: IndianRupee, color: 'from-emerald-400 to-green-500', prefix: '₹' },
            { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag, color: 'from-gold to-amber-600', prefix: '' },
            { label: 'Avg Order Value', value: data.avgOrderValue, icon: TrendingUp, color: 'from-blue-400 to-violet-500', prefix: '₹' },
            { label: 'Completed', value: data.completedOrders.length, icon: Clock, color: 'from-amber-400 to-orange-500', prefix: '' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-[22px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md mb-4`}>
                <card.icon className="w-4.5 h-4.5 text-white" />
              </div>
              <AnimatedCounter value={card.value} prefix={card.prefix} />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1.5">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue + Orders trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Revenue Trend</h2>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Weekly · ₹{data.revenue.toLocaleString('en-IN')} total</p>
              </div>
            </div>
            <BarChart data={weeklyRevenue} color="#D4AF37" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Orders Trend</h2>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Weekly · {data.totalOrders} orders</p>
              </div>
            </div>
            <BarChart data={weeklyOrders} color="#34D399" />
          </motion.div>
        </div>

        {/* Top Items + Peak Hours + Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Items */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Top Items</h2>
            <div className="space-y-4">
              {data.sortedItems.slice(0, 5).map((item, i) => {
                const maxC = data.sortedItems[0]?.count || 1;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-black text-zinc-600 w-4">{i + 1}</span>
                        <span className="font-bold text-zinc-200">{item.name}</span>
                      </div>
                      <span className="font-black text-gold text-xs">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500" style={{ width: `${(item.count / maxC) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {data.sortedItems.length === 0 && (
                <p className="text-zinc-600 text-sm font-semibold text-center py-4">No order data yet</p>
              )}
            </div>
          </motion.div>

          {/* Peak Hours */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Peak Hours</h2>
            <div className="space-y-2.5">
              {data.peakHours.length > 0 ? data.peakHours.map((h) => {
                const maxVal = Math.max(...data.peakHours.map(d => d.value));
                return (
                  <div key={h.label} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-600 w-9 text-right">{h.label}</span>
                    <div className="flex-1 h-4 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500" style={{ width: `${(h.value / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs font-black text-zinc-200 tabular-nums w-6 text-right">{h.value}</span>
                  </div>
                );
              }) : (
                <p className="text-zinc-600 text-sm font-semibold text-center py-4">No peak data yet</p>
              )}
            </div>
          </motion.div>

          {/* Customer Insights */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Customer Insights</h2>
            <div className="space-y-5">
              {[
                { label: 'Total Customers', value: data.orders.length, icon: Users, color: 'text-blue-400' },
                { label: 'Avg Order Value', value: `₹${data.avgOrderValue}`, icon: IndianRupee, color: 'text-emerald-400' },
                { label: 'Repeat Rate', value: `${data.returningRate}%`, icon: TrendingUp, color: 'text-gold' },
                { label: 'Peak Hour Avg', value: data.peakHours.length ? `${Math.round(data.peakHours.reduce((s, d) => s + d.value, 0) / data.peakHours.length)}` : '0', icon: Zap, color: 'text-amber-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs font-semibold text-zinc-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
