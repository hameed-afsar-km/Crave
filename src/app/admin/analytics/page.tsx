'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, IndianRupee, ShoppingBag, Clock,
  ArrowLeft, Users, Zap
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
  return <span ref={ref} className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight">{prefix}{count}{suffix}</span>;
}

function BarChart({ data, color = '#4B5563' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 28;
  const gap = 10;
  const chartH = 140;
  return (
    <svg width="100%" height={chartH + 20} viewBox={`0 0 ${data.length * (barW + gap)} ${chartH + 20}`} className="w-full">
      <defs>
        <linearGradient id={`barGrad_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = (d.value / max) * (chartH - 10);
        const x = i * (barW + gap);
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={`url(#barGrad_${color.replace('#', '')})`} className="hover:opacity-80 transition-opacity" />
            <text x={x + barW / 2} y={chartH + 12} textAnchor="middle" fill="#9CA3AF" fontSize="8" fontWeight="600">{d.label}</text>
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              </div>
              <p className="text-gray-500 text-sm">Key metrics at a glance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-7xl mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: data.revenue, icon: IndianRupee, prefix: '₹' },
            { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag, prefix: '' },
            { label: 'Avg Order Value', value: data.avgOrderValue, icon: TrendingUp, prefix: '₹' },
            { label: 'Completed', value: data.completedOrders.length, icon: Clock, prefix: '' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <card.icon className="w-4 h-4 text-gray-600" />
              </div>
              <AnimatedCounter value={card.value} prefix={card.prefix} />
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue + Orders trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Revenue Trend</h2>
                <p className="text-xs text-gray-500 mt-0.5">Weekly · ₹{data.revenue.toLocaleString('en-IN')} total</p>
              </div>
            </div>
            <BarChart data={weeklyRevenue} color="#4B5563" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Orders Trend</h2>
                <p className="text-xs text-gray-500 mt-0.5">Weekly · {data.totalOrders} orders</p>
              </div>
            </div>
            <BarChart data={weeklyOrders} color="#059669" />
          </motion.div>
        </div>

        {/* Top Items + Peak Hours + Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Selling Items */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">Top Items</h2>
            <div className="space-y-3">
              {data.sortedItems.slice(0, 5).map((item, i) => {
                const maxC = data.sortedItems[0]?.count || 1;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 w-4">{i + 1}</span>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 text-xs">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gray-800" style={{ width: `${(item.count / maxC) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {data.sortedItems.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No order data yet</p>
              )}
            </div>
          </motion.div>

          {/* Peak Hours */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">Peak Hours</h2>
            <div className="space-y-2">
              {data.peakHours.length > 0 ? data.peakHours.map((h) => {
                const maxVal = Math.max(...data.peakHours.map(d => d.value));
                return (
                  <div key={h.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-9 text-right">{h.label}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gray-800" style={{ width: `${(h.value / maxVal) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 tabular-nums w-6 text-right">{h.value}</span>
                  </div>
                );
              }) : (
                <p className="text-gray-400 text-sm text-center py-4">No peak data yet</p>
              )}
            </div>
          </motion.div>

          {/* Customer Insights */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-50">Customer Insights</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Customers', value: data.orders.length, icon: Users },
                { label: 'Avg Order Value', value: `₹${data.avgOrderValue}`, icon: IndianRupee },
                { label: 'Repeat Rate', value: `${data.returningRate}%`, icon: TrendingUp },
                { label: 'Peak Hour Avg', value: data.peakHours.length ? `${Math.round(data.peakHours.reduce((s, d) => s + d.value, 0) / data.peakHours.length)}` : '0', icon: Zap },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 text-gray-400`} />
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
