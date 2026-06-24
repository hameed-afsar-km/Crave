'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, CookingPot, UtensilsCrossed,
  BarChart3, Settings, LogOut, ExternalLink, Menu, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0C0C14]/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="text-lg font-black tracking-widest">
                <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">CRAVE</span>
                <span className="ml-2 text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] border border-zinc-800 px-2 py-0.5 rounded-md">Admin</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {links.map(link => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active ? 'bg-gold/10 text-gold' : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-all">
                <ExternalLink className="w-3.5 h-3.5" /> Site
              </Link>
              <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
                <LogOut className="w-3.5 h-3.5" /> Exit
              </button>
              <button onClick={() => setOpen(true)} className="md:hidden p-2 -mr-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-[#0C0C14] border-l border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.06]">
              <span className="text-xl font-black tracking-widest">
                <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">CRAVE</span>
              </span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1">
              {links.map(link => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-gold/10 text-gold' : 'text-zinc-500 hover:text-zinc-200'}`}
                  >
                    <link.icon className="w-4 h-4" /> {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-1">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-200"><ExternalLink className="w-4 h-4" /> View Site</Link>
              <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400"><LogOut className="w-4 h-4" /> Exit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
