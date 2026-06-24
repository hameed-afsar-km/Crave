'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, CookingPot, UtensilsCrossed,
  BarChart3, Settings, LogOut, ExternalLink, Menu, X,
  IndianRupee, Bell, Dot
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loadSettings } from '@/lib/store';
import { getStoredOrders } from '@/lib/seed-data';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/kitchen', label: 'Kitchen', icon: CookingPot },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState({ pending: 0, revenue: 0, active: 0 });

  useEffect(() => {
    const update = () => {
      const orders = getStoredOrders();
      if (orders) {
        setStats({
          pending: orders.filter((o: any) => o.status !== 'completed').length,
          revenue: orders.reduce((s: number, o: any) => s + (o.amount || 0), 0),
          active: orders.filter((o: any) => o.status === 'received' || o.status === 'preparing').length,
        });
      }
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const settings = loadSettings();
  const live = settings.storeOpen && settings.acceptingOrders;
  const storeLabel = !settings.storeOpen ? 'Closed' : !settings.acceptingOrders ? 'Paused' : 'Live';
  const storeColor = !settings.storeOpen ? 'bg-rose-500' : !settings.acceptingOrders ? 'bg-amber-500' : 'bg-emerald-500';
  const storePulse = live ? 'animate-pulse' : '';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#07070F]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/admin/dashboard" className="text-base sm:text-lg font-black text-gradient-gold tracking-wider shrink-0 mr-1">
                CRAVE
              </Link>
              <div className="hidden md:flex items-center gap-0.5">
                {links.map(link => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200',
                        active
                          ? 'bg-gold/10 text-gold border border-gold/15 shadow-[0_0_12px_rgba(212,175,55,0.06)]'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                      )}
                    >
                      <link.icon className="w-3 h-3" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Store Status + Quick Metrics + Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Revenue pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <IndianRupee className="w-3 h-3 text-gold/60" />
                <span className="text-[10px] font-black text-white tabular-nums">₹{stats.revenue}</span>
              </div>

              {/* Active count pill */}
              {stats.active > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-black text-amber-400 tabular-nums">{stats.active} active</span>
                </div>
              )}

              {/* Store status dot */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className={cn('relative flex h-2 w-2', storePulse)}>
                  <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', storeColor)} />
                  <span className={cn('relative inline-flex rounded-full h-2 w-2', storeColor)} />
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hidden sm:inline">{storeLabel}</span>
              </div>

              {/* Pending badge */}
              <Link
                href="/admin/orders"
                className="relative flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-gold hover:bg-gold/5 border border-transparent hover:border-gold/15 transition-all"
              >
                <ClipboardList className="w-4 h-4" />
                {stats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-[#07070F] tabular-nums">
                    {stats.pending}
                  </span>
                )}
              </Link>

              {/* Divider */}
              <div className="h-5 w-px bg-white/[0.06]" />

              {/* Site link */}
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-gold border border-transparent hover:border-gold/15 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Site
              </Link>

              {/* Exit */}
              <button
                onClick={signOut}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-rose-400/60 hover:text-rose-400 border border-transparent hover:border-rose-500/15 hover:bg-rose-500/8 transition-all"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Exit</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -mr-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-[#07070F]/95 backdrop-blur-2xl border-l border-white/[0.06] shadow-[-4px_0_20px_rgba(0,0,0,0.4)] animate-slide-in-right p-5">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <span className="text-base font-black text-gradient-gold tracking-wider">CRAVE</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {links.map(link => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      active ? 'bg-gold/10 text-gold' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all">
                <ExternalLink className="w-4 h-4" /> View Site
              </Link>
              <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/8 transition-all">
                <LogOut className="w-4 h-4" /> Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
