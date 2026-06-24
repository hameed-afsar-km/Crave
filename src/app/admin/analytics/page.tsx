'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, IndianRupee, ShoppingBag, Clock,
  ArrowLeft, ChevronRight, Calendar, Download
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

/* ── SVG Bar Chart ── */
function BarChart({
  data,
  color = '#D4AF37',
  labelKey = 'label' as string,
  valueKey = 'value' as string,
  barW = 24,
  gap = 8,
  showLabels = true,
  prefix = '',
}: {
  data: Record<string, any>[];
  color?: string;
  labelKey?: string;
  valueKey?: string;
  barW?: number;
  gap?: number;
  showLabels?: boolean;
  prefix?: string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]));
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
        const barH = (d[valueKey] / max) * (chartH - 10);
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={`url(#barGrad_${color.replace('#', '')})`} className="hover:opacity-80 transition-opacity cursor-pointer" />
            {showLabels && (
              <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontWeight="700">
                {d[labelKey]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Data ── */
const monthlyRevenue = [
  { label: 'Jan', value: 185000 },
  { label: 'Feb', value: 210000 },
  { label: 'Mar', value: 195000 },
  { label: 'Apr', value: 240000 },
  { label: 'May', value: 280000 },
  { label: 'Jun', value: 312000 },
];

const weeklyOrders = [
  { label: 'Mon', value: 38 },
  { label: 'Tue', value: 42 },
  { label: 'Wed', value: 40 },
  { label: 'Thu', value: 48 },
  { label: 'Fri', value: 52 },
  { label: 'Sat', value: 68 },
  { label: 'Sun', value: 55 },
];

const popularItems = [
  { name: 'Chicken Shawarma', orders: 156, revenue: 28080, pct: 100 },
  { name: 'Beef Burger', orders: 118, revenue: 29500, pct: 86 },
  { name: 'Chicken Combo', orders: 95, revenue: 33250, pct: 72 },
  { name: 'French Fries', orders: 82, revenue: 9840, pct: 60 },
  { name: 'Chocolate Milkshake', orders: 68, revenue: 9520, pct: 48 },
  { name: 'Chicken Burger', orders: 55, revenue: 11000, pct: 38 },
  { name: 'Veg Shawarma', orders: 42, revenue: 6300, pct: 30 },
];

const peakHoursData = [
  { label: '11a', value: 8 },
  { label: '12p', value: 18 },
  { label: '1p', value: 24 },
  { label: '2p', value: 15 },
  { label: '3p', value: 6 },
  { label: '4p', value: 5 },
  { label: '5p', value: 12 },
  { label: '6p', value: 22 },
  { label: '7p', value: 28 },
  { label: '8p', value: 20 },
  { label: '9p', value: 10 },
  { label: '10p', value: 4 },
];

const categoryBreakdown = [
  { label: 'Shawarma', value: 35, color: '#D4AF37' },
  { label: 'Burgers', value: 28, color: '#F59E0B' },
  { label: 'Combos', value: 18, color: '#8B5CF6' },
  { label: 'Fries', value: 10, color: '#10B981' },
  { label: 'Drinks', value: 7, color: '#3B82F6' },
  { label: 'Desserts', value: 4, color: '#EC4899' },
];

export default function AdminAnalytics() {
  const { isAdmin } = useAuth();

  const totalRevenue = monthlyRevenue.reduce((s, d) => s + d.value, 0);
  const totalOrders = weeklyOrders.reduce((s, d) => s + d.value, 0);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
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
              <p className="text-zinc-500 text-sm">Performance overview for the current period</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 relative z-10 space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Revenue (6mo)', value: totalRevenue, icon: IndianRupee, color: 'from-emerald-400 to-green-500', prefix: '₹' },
            { label: 'Total Orders (week)', value: totalOrders, icon: ShoppingBag, color: 'from-gold to-amber-600', prefix: '' },
            { label: 'Avg. Order Value', value: Math.round(totalRevenue / totalOrders), icon: TrendingUp, color: 'from-blue-400 to-violet-500', prefix: '₹' },
            { label: 'Peak Hour Avg', value: Math.round(peakHoursData.reduce((s, d) => s + d.value, 0) / peakHoursData.length), icon: Clock, color: 'from-amber-400 to-orange-500', prefix: '' },
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Monthly Revenue</h2>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">₹{totalRevenue.toLocaleString('en-IN')} total · Trending up</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400">
                <TrendingUp className="w-3 h-3" /> +12.4%
              </span>
            </div>
            <BarChart data={monthlyRevenue} color="#D4AF37" labelKey="label" valueKey="value" barW={32} gap={16} prefix="₹" />
          </motion.div>

          {/* Weekly Orders */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Weekly Orders</h2>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{totalOrders} orders this week</p>
              </div>
            </div>
            <BarChart data={weeklyOrders} color="#34D399" labelKey="label" valueKey="value" barW={28} gap={12} />
          </motion.div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Peak Hours */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Peak Hours — Order Volume</h2>
            </div>
            <div className="space-y-2.5">
              {peakHoursData.map((h) => {
                const maxVal = Math.max(...peakHoursData.map(d => d.value));
                const pct = (h.value / maxVal) * 100;
                return (
                  <div key={h.label} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-600 w-7 text-right">{h.label}</span>
                    <div className="flex-1 h-4 bg-black/40 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold to-amber-500"
                      />
                    </div>
                    <span className="text-xs font-black text-zinc-200 tabular-nums w-6 text-right">{h.value}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Category Mix</h2>
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => {
                const maxVal = Math.max(...categoryBreakdown.map(c => c.value));
                const pct = (cat.value / maxVal) * 100;
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                        <span className="text-xs font-semibold text-zinc-300">{cat.label}</span>
                      </div>
                      <span className="text-xs font-black text-zinc-400">{cat.value}%</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Popular Items Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Popular Items (This Month)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['#', 'Item', 'Orders', 'Revenue', 'Popularity'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {popularItems.map((item, i) => (
                  <tr key={item.name} className="border-b border-white/[0.04] hover:bg-gold/[0.015] transition-colors group">
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-black text-zinc-600">{String(i + 1).padStart(2, '0')}</span>
                    </td>
                    <td className="px-4 py-4 font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">{item.name}</td>
                    <td className="px-4 py-4 font-black text-sm text-zinc-300">{item.orders}</td>
                    <td className="px-4 py-4 font-black text-sm text-gold">₹{item.revenue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4">
                      <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500" style={{ width: `${item.pct}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
