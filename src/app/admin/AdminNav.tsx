'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, CookingPot, UtensilsCrossed,
  BarChart3, Settings, LogOut, ExternalLink, Menu, X,
  ChevronLeft, Store, Activity, Bug, Users, Tag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminPath } from '@/lib/admin-slug';

export default function AdminNav() {
  const pathname = usePathname();
  const { signOut, isMasterAdmin, isOutletStaff, assignedOutletName } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const links = isMasterAdmin
    ? [
        { href: adminPath('dashboard'), label: 'Dashboard', icon: LayoutDashboard },
        { href: adminPath('orders'), label: 'Orders', icon: ClipboardList },
        { href: adminPath('kitchen'), label: 'Kitchen', icon: CookingPot },
        { href: adminPath('menu'), label: 'Menu', icon: UtensilsCrossed },
        { href: adminPath('coupons'), label: 'Coupons', icon: Tag },
        { href: adminPath('analytics'), label: 'Analytics', icon: BarChart3 },
        { href: adminPath('outlets'), label: 'Outlets', icon: Store },
        { href: adminPath('users'), label: 'Users', icon: Users },
        { href: adminPath('logs'), label: 'Logs', icon: Activity },
        { href: adminPath('bugs'), label: 'Bugs', icon: Bug },
        { href: adminPath('settings'), label: 'Settings', icon: Settings },
      ]
    : isOutletStaff
    ? [
        { href: adminPath('orders'), label: 'Orders', icon: ClipboardList },
        { href: adminPath('kitchen'), label: 'Kitchen', icon: CookingPot },
        { href: adminPath('menu'), label: 'Menu', icon: UtensilsCrossed },
      ]
    : [
        { href: adminPath('dashboard'), label: 'Dashboard', icon: LayoutDashboard },
        { href: adminPath('orders'), label: 'Orders', icon: ClipboardList },
        { href: adminPath('kitchen'), label: 'Kitchen', icon: CookingPot },
        { href: adminPath('menu'), label: 'Menu', icon: UtensilsCrossed },
        { href: adminPath('coupons'), label: 'Coupons', icon: Tag },
        { href: adminPath('analytics'), label: 'Analytics', icon: BarChart3 },
      ];

  const nav = (
    <nav className={`flex flex-col h-full ${collapsed ? 'items-center px-2' : 'px-3'}`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} h-14 shrink-0 ${collapsed ? '' : 'px-1'}`}>
        <Link href={adminPath('dashboard')} className="flex items-center gap-1.5">
          {collapsed ? (
            <span className="text-base font-bold tracking-tight text-white">C</span>
          ) : (
            <>
              <span className="text-base font-bold tracking-tight text-white">Crave</span>
              <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider border border-zinc-700 px-1.5 py-0.5 rounded">
                {isMasterAdmin ? 'Admin' : isOutletStaff ? 'Staff' : 'Manager'}
              </span>
            </>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all hidden lg:block"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {!collapsed && assignedOutletName && !isMasterAdmin && (
        <div className="mx-2 mt-1 mb-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400 truncate">
          {assignedOutletName}
        </div>
      )}

      <div className={`mt-2 flex-1 space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {links.map(link => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all ${
                collapsed ? 'p-2 justify-center w-9 h-9' : 'px-2.5 py-2'
              } ${
                active
                  ? 'bg-zinc-800/80 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
              title={collapsed ? link.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </div>

      <div className={`border-t border-zinc-800 py-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <Link
          href="/"
          className={`flex items-center gap-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all ${
            collapsed ? 'p-2 justify-center w-9 h-9' : 'px-2.5 py-2'
          }`}
          title={collapsed ? 'View Site' : undefined}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && 'View Site'}
        </Link>
        <button
          onClick={signOut}
          className={`flex items-center gap-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full ${
            collapsed ? 'p-2 justify-center w-9 h-9' : 'px-2.5 py-2'
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-[#08080C] border-r border-zinc-800/60 z-40 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-52'
      }`}>
        {nav}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0A0A0F] border-b border-zinc-800/60 z-40 flex items-center justify-between px-4">
        <Link href={adminPath('dashboard')} className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-white">Crave</span>
          <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider border border-zinc-700 px-1.5 py-0.5 rounded">
            {isMasterAdmin ? 'Admin' : isOutletStaff ? 'Staff' : 'Manager'}
          </span>
        </Link>
        <button onClick={() => setOpen(true)} className="p-2 -mr-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-[#0A0A0F] border-l border-zinc-800/60">
            <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-800/60">
              <span className="text-base font-bold tracking-tight text-white">Crave</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            {assignedOutletName && !isMasterAdmin && (
              <div className="px-4 py-2 text-xs text-zinc-400 border-b border-zinc-800/60">{assignedOutletName}</div>
            )}
            <div className="p-2">
              {links.map(link => {
                const active = pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active ? 'bg-zinc-800/80 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="px-2 border-t border-zinc-800/60 pt-2 mt-2">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all">
                <ExternalLink className="w-4 h-4" /> View Site
              </Link>
              <button onClick={signOut} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
