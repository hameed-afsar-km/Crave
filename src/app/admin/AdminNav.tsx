'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, CookingPot, UtensilsCrossed, BarChart3, Settings, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import { loadSettings } from '@/lib/store';
import { getStoredOrders } from '@/lib/seed-data';

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
  const [pendingCount, setPendingCount] = useState(0);
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      const orders = getStoredOrders();
      if (orders) {
        setPendingCount(orders.filter((o: any) => o.status !== 'completed').length);
      }
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  const settings = loadSettings();
  const storeStatus = settings.storeOpen ? (settings.acceptingOrders ? 'Open' : 'Paused') : 'Closed';
  const statusTextClass = settings.storeOpen ? (settings.acceptingOrders ? 'text-emerald-400' : 'text-amber-400') : 'text-rose-400';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#07070F]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.03),0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + links */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-base font-black text-gradient-gold tracking-wider hover:scale-105 transition-transform shrink-0"
            >
              CRAVE
            </Link>

            <div className="h-4 w-px bg-white/5" />

            <div className="flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
              {links.map(link => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-gold/10 text-gold border border-gold/15'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/4 border border-transparent'
                    }`}
                  >
                    <link.icon className="w-3 h-3" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Live status + Actions */}
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{liveTime}</span>
              <span className="text-zinc-700 text-[9px]">|</span>
              <span className={`text-[9px] font-black uppercase tracking-wider ${statusTextClass}`}>
                {storeStatus}
              </span>
              <span className="text-zinc-700 text-[9px]">|</span>
              <span className="text-[9px] font-black text-zinc-400 tabular-nums">{pendingCount} pending</span>
            </div>

            <Link
              href="/admin/orders"
              className="relative flex sm:hidden p-2 rounded-lg text-zinc-400 hover:text-gold hover:bg-gold/5 border border-transparent hover:border-gold/15 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[7px] font-black flex items-center justify-center ring-2 ring-[#07070F]">
                  {pendingCount}
                </span>
              )}
            </Link>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-gold border border-transparent hover:border-gold/20 hover:bg-gold/5 rounded-lg transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Site
            </Link>

            <div className="h-4 w-px bg-white/5" />

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/10 hover:border-red-500/28 text-red-400 bg-red-500/5 hover:bg-red-500/12 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
