'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart3, Settings, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#07070F]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.03),0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + links */}
          <div className="flex items-center gap-6">
            <Link
              href="/admin/dashboard"
              className="text-lg font-black text-gradient-gold tracking-widest hover:scale-105 transition-transform"
            >
              CRAVE
            </Link>

            <div className="h-5 w-px bg-white/5" />

            <div className="flex items-center gap-1">
              {links.map(link => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                      active
                        ? 'bg-gold/10 text-gold border border-gold/15'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/4 border border-transparent'
                    }`}
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-gold border border-transparent hover:border-gold/20 hover:bg-gold/5 rounded-xl transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              View Site
            </Link>

            <div className="h-5 w-px bg-white/5" />

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3.5 py-2 border border-red-500/10 hover:border-red-500/28 text-red-400 bg-red-500/5 hover:bg-red-500/12 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
