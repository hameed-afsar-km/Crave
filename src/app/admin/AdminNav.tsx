'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, CookingPot, UtensilsCrossed,
  BarChart3, Settings, LogOut, ExternalLink, Menu, X,
  IndianRupee, Bell
} from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => {
      const orders = getStoredOrders();
      if (orders) {
        setPending(orders.filter((o: any) => o.status !== 'completed').length);
        setRevenue(orders.reduce((s: number, o: any) => s + (o.amount || 0), 0));
        setActive(orders.filter((o: any) => o.status === 'received' || o.status === 'preparing').length);
      }
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const settings = loadSettings();
  const isLive = settings.storeOpen && settings.acceptingOrders;
  const statusLabel = !settings.storeOpen ? 'CLOSED' : !settings.acceptingOrders ? 'PAUSED' : 'OPEN';
  const statusColors = {
    bg: !settings.storeOpen ? 'bg-rose-500/20 border-rose-500/30' : !settings.acceptingOrders ? 'bg-amber-500/20 border-amber-500/30' : 'bg-emerald-500/20 border-emerald-500/30',
    text: !settings.storeOpen ? 'text-rose-400' : !settings.acceptingOrders ? 'text-amber-400' : 'text-emerald-400',
    dot: !settings.storeOpen ? 'bg-rose-500' : !settings.acceptingOrders ? 'bg-amber-500' : 'bg-emerald-500',
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06060A]/80 backdrop-blur-md border-b border-white/[0.04] transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Left Section: Logo & Nav Links */}
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                <span className="text-xl font-black bg-gradient-to-r from-gold via-yellow-500 to-amber-500 bg-clip-text text-transparent tracking-widest shrink-0">
                  CRAVE
                </span>
                <span className="hidden lg:inline text-[9px] font-black tracking-[0.2em] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase border border-zinc-700/50">
                  Admin
                </span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-xl">
                {links.map(link => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-r from-gold/15 to-amber-500/10 text-gold border border-gold/20 shadow-[0_2px_10px_rgba(212,175,55,0.08)]'
                          : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                      }`}
                    >
                      <link.icon className="w-3 h-3" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Section: Status, Stats & Exit */}
            <div className="flex items-center gap-3">

              {/* Store status badge */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-[0_0_12px_rgba(0,0,0,0.4)] ${statusColors.bg}`}>
                <span className="relative flex h-2 w-2">
                  {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors.dot}`} />
                </span>
                <span className={`text-[10px] font-black tracking-widest ${statusColors.text}`}>{statusLabel}</span>
              </div>

              {/* Revenue Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                <IndianRupee className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-black text-white tabular-nums">₹{revenue}</span>
              </div>

              {/* Active orders */}
              {active > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                  </span>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest tabular-nums">{active} Live</span>
                </div>
              )}

              {/* Pending icon */}
              <Link
                href="/admin/orders"
                title="Pending Orders"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-gold hover:bg-gold/5 border border-white/[0.04] hover:border-gold/20 transition-all shadow-md"
              >
                <ClipboardList className="w-4 h-4" />
                {pending > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-[#06060A] tabular-nums shadow-lg">
                    {pending}
                  </span>
                )}
              </Link>

              <div className="h-6 w-px bg-white/[0.06]" />

              {/* View Site */}
              <Link
                href="/"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/[0.02] transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Site
              </Link>

              {/* Exit/Sign Out */}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-400/60 hover:text-rose-400 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </button>

              {/* Mobile Menu Icon */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent active:scale-95"
              >
                <Menu className="w-5 h-5" />
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-[#06060A]/95 border-l border-white/[0.06] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06]">
                <span className="text-xl font-black bg-gradient-to-r from-gold to-amber-500 bg-clip-text text-transparent tracking-widest">CRAVE</span>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1.5">
                {links.map(link => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        active
                          ? 'bg-gradient-to-r from-gold/15 to-amber-500/10 text-gold border border-gold/15'
                          : 'text-zinc-500 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Revenue</span>
                <span className="text-sm font-black text-white flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-gold/80" /> {revenue}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Active</span>
                <span className="text-xs font-black text-amber-400">{active} Live</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white border border-white/[0.06] hover:bg-white/[0.02] transition-all"
                >
                  <ExternalLink className="w-4.5 h-4.5" /> Site
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-400 border border-rose-500/15 hover:bg-rose-500/5 transition-all"
                >
                  <LogOut className="w-4.5 h-4.5" /> Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
