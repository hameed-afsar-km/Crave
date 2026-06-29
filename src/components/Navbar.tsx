'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { loadSettings } from '@/lib/store';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/rewards', label: 'Rewards' },
];

const statusColor = {
  Open: 'bg-emerald-400',
  Paused: 'bg-amber-400',
  Closed: 'bg-rose-400',
} as const;

const statusBg = {
  Open: 'bg-emerald-500/10 text-emerald-300',
  Paused: 'bg-amber-500/10 text-amber-300',
  Closed: 'bg-rose-500/10 text-rose-300',
} as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 60);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const [storeLabel, setStoreLabel] = useState('Open');

  useEffect(() => {
    const update = () => {
      const s = loadSettings();
      setStoreLabel(s.storeOpen ? (s.acceptingOrders ? 'Open' : 'Paused') : 'Closed');
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
      >
        {/* Scrolled shadow glow — only when scrolled */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-4 top-0 h-full rounded-2xl bg-gradient-to-b from-gold/5 to-transparent blur-3xl pointer-events-none"
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={{
            borderColor: scrolled ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.06)',
            boxShadow: scrolled
              ? '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08)'
              : '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl bg-[#0C0C14]/85 backdrop-blur-2xl border rounded-2xl px-5 md:px-6 py-2.5 md:py-3"
        >
          <div className="flex items-center justify-between h-[40px] md:h-[44px]">
            {/* Left: Nav links (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'relative px-3.5 py-1.5 text-sm font-bold tracking-wider transition-all duration-300',
                        active
                          ? 'text-gold'
                          : 'text-zinc-500 hover:text-zinc-200'
                      )}
                    >
                      {link.label}
                      {active && (
                        <motion.span
                          layoutId="activeDot"
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gold"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Left mobile: Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 -ml-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
              </motion.div>
            </button>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <motion.div whileHover={{ scale: 1.04 }} transition={{ type: 'spring', stiffness: 350, damping: 20 }}>
                <Image
                  src="/logo.webp"
                  alt="Crave"
                  width={160}
                  height={40}
                  className="h-6 md:h-8 w-auto"
                />
              </motion.div>
            </Link>

            {/* Right: Status + Icons */}
            <div className="flex items-center gap-2">
              {/* Status */}
              <div className={cn(
                'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold leading-none transition-all',
                statusBg[storeLabel as keyof typeof statusBg]
              )}>
                <span className={cn('w-2 h-2 rounded-full', statusColor[storeLabel as keyof typeof statusColor])} />
                {storeLabel}
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-4 bg-white/6" />

              {/* Icons */}
              <div className="flex items-center gap-0.5">
                {isAdmin && (
                  <IconBtn href="/admin/dashboard" title="Dashboard">
                    <LayoutDashboard className="w-[18px] h-[18px]" />
                  </IconBtn>
                )}

                {user && (
                  <IconBtn href="/orders" title="Orders">
                    <Package className="w-[18px] h-[18px]" />
                  </IconBtn>
                )}

                <Link
                  href="/cart"
                  title="Cart"
                  className="relative p-1 rounded-lg text-zinc-500 hover:text-gold hover:bg-gold/8 transition-all"
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-[17px] h-[17px] rounded-full bg-gradient-to-br from-gold to-amber-500 text-[8px] font-black text-white"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </Link>

                {user ? (
                  <IconBtn href="/profile" title="Profile">
                    <User className="w-[18px] h-[18px]" />
                  </IconBtn>
                ) : (
                  <Link
                    href="/auth"
                    className="px-3 py-1.5 text-xs font-bold tracking-wider rounded-lg text-zinc-400 hover:text-gold hover:bg-gold/8 transition-all uppercase"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Scroll progress bar */}
      {mounted && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-gold/60 via-gold to-gold/60 origin-left"
          style={{ scaleX }}
        />
      )}

      {/* Full-screen Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-40"
          >
            <div className="absolute inset-0 bg-[#0C0C14]/95 backdrop-blur-xl" onClick={closeMobile} />

            <div className="relative flex flex-col h-full pt-24 pb-10 px-6">
              <button
                onClick={closeMobile}
                className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 flex flex-col items-center justify-center gap-1">
                {navLinks.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ delay: i * 0.07, duration: 0.35 }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMobile}
                        className={cn(
                          'flex items-center gap-3 px-6 py-3 text-2xl font-bold tracking-tight transition-all duration-200',
                          active ? 'text-gold' : 'text-zinc-500 hover:text-white'
                        )}
                      >
                        {link.label}
                        {active && <motion.span layoutId="mobDot" className="w-2 h-2 rounded-full bg-gold" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-t border-white/5 pt-6 space-y-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', statusColor[storeLabel as keyof typeof statusColor])} />
                  <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">
                    Store is {storeLabel}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Link
                    href="/cart"
                    onClick={closeMobile}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                    {itemCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-gold text-black text-[10px] font-black rounded-full">{itemCount}</span>
                    )}
                  </Link>

                  {user ? (
                    <>
                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          onClick={closeMobile}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin
                        </Link>
                      )}
                      <Link
                        href="/orders"
                        onClick={closeMobile}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                      >
                        <Package className="w-4 h-4" />
                        Orders
                      </Link>
                      <Link
                        href="/profile"
                        onClick={closeMobile}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => { signOut(); closeMobile(); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-300 hover:bg-rose-500/20 transition-all text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={closeMobile}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-white font-bold text-sm transition-all hover:brightness-110"
                    >
                      Sign In to Order
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="p-1 rounded-lg text-zinc-500 hover:text-gold hover:bg-gold/8 transition-all"
    >
      {children}
    </Link>
  );
}
