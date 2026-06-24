'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingBag, IndianRupee, Clock, CheckCircle,
  TrendingUp, TrendingDown, Package, Users, ArrowRight,
  Zap, ChevronRight, MoreHorizontal, Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { seedSampleData, isSeeded } from '@/lib/seed-data';

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const steps = 32;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, inView]);

  return (
    <span ref={ref} className="text-3xl font-black text-white tabular-nums tracking-tight">
      {prefix}{count}{suffix}
    </span>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  );
}

/* ── Bar chart component (inline SVG) ── */
function RevenueChart({ data }: { data: { day: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue));
  const barW = 32;
  const gap = 12;
  const chartW = data.length * (barW + gap) - gap;
  const chartH = 160;

  return (
    <div className="relative">
      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = (d.revenue / max) * (chartH - 20);
          const x = i * (barW + gap);
          const y = chartH - barH - 10;
          return (
            <g key={d.day}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill="url(#barGrad)" className="hover:opacity-80 transition-opacity cursor-pointer" />
              <text x={x + barW / 2} y={chartH - 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="inherit" fontWeight="700">
                {d.day}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="rgba(212,175,55,0.5)" fontSize="9" fontFamily="inherit" fontWeight="700">
                ₹{(d.revenue / 1000).toFixed(1)}k
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Donut chart (inline SVG) ── */
function StatusDonut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width="130" height="130" viewBox="0 0 120 120" className="shrink-0">
        {data.map((d) => {
          const pct = d.value / total;
          const len = pct * circ;
          const dash = `${len} ${circ - len}`;
          const o = -offset;
          offset += len;
          return (
            <circle
              key={d.label}
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={o}
              transform="rotate(-90, 60, 60)"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          );
        })}
        <text x="60" y="56" textAnchor="middle" fill="white" fontSize="22" fontFamily="inherit" fontWeight="900">{total}</text>
        <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="inherit" fontWeight="700">Orders</text>
      </svg>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            <span className="text-zinc-500 font-semibold">{d.label}</span>
            <span className="text-white font-black ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Data ── */
const statsCards = [
  { label: 'Orders Today', value: 48, icon: ShoppingBag, color: 'from-gold to-amber-600', glow: 'rgba(212,175,55,0.2)', prefix: '', trend: '+12%', up: true, sparkline: [32, 38, 35, 42, 40, 48] },
  { label: 'Revenue Today', value: 12450, icon: IndianRupee, color: 'from-emerald-400 to-green-500', glow: 'rgba(52,211,153,0.2)', prefix: '₹', trend: '+8%', up: true, sparkline: [8200, 10500, 9800, 11200, 11800, 12450] },
  { label: 'Pending Orders', value: 12, icon: Clock, color: 'from-amber-400 to-orange-500', glow: 'rgba(251,191,36,0.2)', prefix: '', trend: '-3%', up: false, sparkline: [18, 15, 14, 16, 13, 12] },
  { label: 'Completed Today', value: 36, icon: CheckCircle, color: 'from-blue-400 to-violet-500', glow: 'rgba(96,165,250,0.2)', prefix: '', trend: '+18%', up: true, sparkline: [22, 26, 28, 30, 33, 36] },
];

const weeklyRevenue = [
  { day: 'Mon', revenue: 8200 },
  { day: 'Tue', revenue: 10500 },
  { day: 'Wed', revenue: 9800 },
  { day: 'Thu', revenue: 11200 },
  { day: 'Fri', revenue: 11800 },
  { day: 'Sat', revenue: 14250 },
  { day: 'Sun', revenue: 12450 },
];

const statusDist = [
  { label: 'Received', value: 8, color: '#60A5FA' },
  { label: 'Preparing', value: 12, color: '#FBBF24' },
  { label: 'Ready', value: 6, color: '#34D399' },
  { label: 'Completed', value: 36, color: '#6B7280' },
];

const topItems = [
  { name: 'Chicken Shawarma', sold: 24, revenue: 4320, pct: 100 },
  { name: 'Beef Burger', sold: 18, revenue: 4500, pct: 86 },
  { name: 'Chicken Combo', sold: 14, revenue: 4900, pct: 72 },
  { name: 'French Fries', sold: 12, revenue: 1440, pct: 58 },
  { name: 'Chocolate Milkshake', sold: 10, revenue: 1400, pct: 45 },
];

const recentActivity = [
  { action: 'Order #CRV-048 marked as preparing', time: '2 min ago', type: 'update' },
  { action: 'New order #CRV-049 received', time: '5 min ago', type: 'new' },
  { action: 'Order #CRV-047 marked as ready', time: '8 min ago', type: 'update' },
  { action: 'Menu item "Grilled Sandwich" price updated', time: '15 min ago', type: 'edit' },
  { action: 'Order #CRV-046 collected', time: '22 min ago', type: 'complete' },
];

const peakHours = [
  { hour: '12:00', orders: 18 },
  { hour: '13:00', orders: 24 },
  { hour: '14:00', orders: 15 },
  { hour: '18:00', orders: 22 },
  { hour: '19:00', orders: 28 },
  { hour: '20:00', orders: 20 },
  { hour: '21:00', orders: 10 },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [storeOpen, setStoreOpen] = useState(true);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    setSeeded(isSeeded());
  }, []);

  const handleSeedData = () => {
    seedSampleData();
    setSeeded(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-zinc-500 text-sm mb-6">Administrator credentials required.</p>
          <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-gold to-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-full">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Dashboard</h1>
              </div>
              <p className="text-zinc-500 text-sm">Welcome back, {user?.name || 'Administrator'}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Seed data */}
              <button
                onClick={handleSeedData}
                disabled={seeded}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                  seeded
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                    : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/18 hover:border-gold/30'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                {seeded ? 'Seeded ✓' : 'Seed Sample Data'}
              </button>
              {/* Store toggle */}
              <button
                onClick={() => setStoreOpen(!storeOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                  storeOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${storeOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {storeOpen ? 'Open' : 'Closed'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 relative z-10 space-y-8">
        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statsCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-[22px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] hover:border-white/[0.1] p-5 transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-2xl" style={{ background: card.glow }} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                  <card.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-black ${card.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {card.trend}
                  </span>
                  {card.up ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <AnimatedCounter value={card.value} prefix={card.prefix} />
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1.5">{card.label}</p>
                </div>
                <MiniSparkline data={card.sparkline} color={card.up ? '#34D399' : '#F87171'} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Row: Revenue Chart + Status Donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-2 rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Weekly Revenue</h2>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Total: ₹76,200</p>
              </div>
              <Link href="/admin/analytics" className="text-[11px] font-black text-gold/70 hover:text-gold transition-colors flex items-center gap-1">
                Full Report <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto pb-2">
              <RevenueChart data={weeklyRevenue} />
            </div>
          </motion.div>

          {/* Status distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Order Status</h2>
            <StatusDonut data={statusDist} />
          </motion.div>
        </div>

        {/* ── Row: Top Items + Activity + Peak Hours ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top selling items */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Top Items</h2>
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black text-zinc-600 w-4">{i + 1}</span>
                      <span className="font-bold text-zinc-200">{item.name}</span>
                    </div>
                    <span className="font-black text-gold text-xs">₹{(item.revenue / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold to-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{item.sold} sold</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Recent Activity</h2>
            <div className="space-y-1">
              {recentActivity.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    a.type === 'new' ? 'bg-gold/[0.03] border border-gold/8' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    a.type === 'new' ? 'bg-gold' : a.type === 'complete' ? 'bg-emerald-400' : 'bg-zinc-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 font-semibold leading-tight truncate">{a.action}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{a.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Peak hours */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
          >
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">Peak Hours</h2>
            <div className="space-y-3">
              {peakHours.map((h) => {
                const maxOrders = Math.max(...peakHours.map(p => p.orders));
                const pct = (h.orders / maxOrders) * 100;
                return (
                  <div key={h.hour} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-600 w-10 text-right">{h.hour}</span>
                    <div className="flex-1 h-5 bg-black/40 rounded-full overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500/60 to-gold transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-zinc-200 w-6 text-right">{h.orders}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/analytics" className="mt-5 inline-flex items-center gap-1 text-[11px] font-black text-gold/70 hover:text-gold transition-colors">
              View detailed analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </div>

        {/* ── Recent Orders Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Recent Orders</h2>
              <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Latest 5 orders needing attention</p>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest bg-gold/10 text-gold border border-gold/15 rounded-xl hover:bg-gold/18 transition-all">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Order', 'Customer', 'Items', 'Amount', 'Pickup', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { id: '#CRV-048', customer: 'Rahul K.', items: 3, amount: 480, time: '18:30', status: 'preparing' },
                  { id: '#CRV-047', customer: 'Priya S.', items: 2, amount: 330, time: '18:15', status: 'ready' },
                  { id: '#CRV-049', customer: 'Amit P.', items: 4, amount: 680, time: '18:45', status: 'received' },
                  { id: '#CRV-046', customer: 'Divya R.', items: 1, amount: 180, time: '18:00', status: 'completed' },
                  { id: '#CRV-045', customer: 'Vikram S.', items: 2, amount: 530, time: '17:30', status: 'preparing' },
                ].map((order, i) => {
                  const statusStyles: Record<string, string> = {
                    received: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
                    preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
                    ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
                    completed: 'bg-zinc-800/30 text-zinc-500 border-white/5',
                  };
                  return (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-gold/[0.015] transition-colors group">
                      <td className="px-4 py-3.5 font-black text-sm text-white">{order.id}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-zinc-300">{order.customer}</td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500 font-semibold">{order.items} items</td>
                      <td className="px-4 py-3.5 font-black text-sm text-zinc-200">₹{order.amount}</td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500 font-bold flex items-center gap-1.5"><Clock className="w-3 h-3 text-gold/50" />{order.time}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[order.status]}`}>
                          <span className={`w-1 h-1 rounded-full ${
                            order.status === 'received' ? 'bg-blue-400' : order.status === 'preparing' ? 'bg-amber-400' : order.status === 'ready' ? 'bg-emerald-400' : 'bg-zinc-600'
                          }`} />
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
