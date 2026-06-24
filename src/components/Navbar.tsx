'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Flame, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { loadSettings } from '@/lib/store';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
];

const statusColors = {
  Open: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]',
  Paused: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]',
  Closed: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.4)]',
} as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const isHome = pathname === '/';
  const isTransparent = isHome && !scrolled;

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.001 });

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

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          isTransparent
            ? 'py-5 md:py-6'
            : 'py-3 md:py-3.5 bg-[#08080B]/70 backdrop-blur-2xl',
          'transition-all duration-500'
        )}
      >
        {/* Full-width border glow — always present, intensifies on scroll */}
        <div className={cn(
          'absolute inset-x-0 top-0 h-px transition-opacity duration-700',
          'bg-gradient-to-r from-transparent via-gold/15 to-transparent',
          isTransparent ? 'opacity-40' : 'opacity-100'
        )} />

        {/* Bottom edge */}
        <div className={cn(
          'absolute inset-x-0 bottom-0 h-px transition-opacity duration-700',
          'bg-gradient-to-r from-transparent via-white/[0.04] to-transparent',
          isTransparent ? 'opacity-0' : 'opacity-100'
        )} />

        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[48px] md:h-[56px]">

            {/* Left: Logo + Nav Links */}
            <div className="flex items-center gap-5 md:gap-8">
              <Link href="/" className="shrink-0">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                >
                  <Image
                    src="/logo.webp"
                    alt="Crave"
                    width={160}
                    height={40}
                    className="h-6 md:h-8 w-auto"
                  />
                </motion.div>
              </Link>

              <div className="hidden md:flex items-center gap-0.5">
                {navLinks.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          'relative px-3 py-1.5 text-sm font-semibold tracking-wide rounded-lg transition-all duration-300',
                          isTransparent
                            ? active ? 'text-white' : 'text-white/55 hover:text-white'
                            : active ? 'text-gold' : 'text-zinc-400 hover:text-gold'
                        )}
                      >
                        {link.label}
                        {active && (
                          <motion.div
                            layoutId="navActive"
                            className={cn(
                              'absolute -bottom-px left-2 right-2 h-px rounded-full',
                              isTransparent ? 'bg-white/40' : 'bg-gold/60'
                            )}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Store status dot */}
              <div
                className={cn('w-2 h-2 rounded-full', statusColors[storeLabel as keyof typeof statusColors])}
                title={`Store ${storeLabel}`}
              />

              {/* Icon group */}
              <div className={cn(
                'flex items-center gap-0.5 rounded-xl px-1 py-1 transition-all duration-500',
                isTransparent
                  ? 'bg-white/[0.04] border border-white/[0.06]'
                  : 'bg-white/[0.03] border border-white/[0.04]'
              )}>
                {isAdmin && (
                  <NavIconBtn href="/admin/dashboard" title="Admin Dashboard" isTransparent={isTransparent}>
                    <LayoutDashboard className="w-4 h-4" />
                  </NavIconBtn>
                )}

                {user && (
                  <NavIconBtn href="/orders" title="My Orders" isTransparent={isTransparent}>
                    <Package className="w-4 h-4" />
                  </NavIconBtn>
                )}

                <NavIconBtn href="/cart" title="Cart" isTransparent={isTransparent} badge={itemCount}>
                  <ShoppingCart className="w-4 h-4" />
                </NavIconBtn>

                {user ? (
                  <>
                    <NavIconBtn href="/profile" title="Profile" isTransparent={isTransparent}>
                      <User className="w-4 h-4" />
                    </NavIconBtn>

                    <button
                      onClick={signOut}
                      title="Sign Out"
                      className={cn(
                        'p-1.5 rounded-lg transition-all duration-300',
                        isTransparent
                          ? 'text-white/40 hover:text-red-400 hover:bg-red-500/10'
                          : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="pl-0.5">
                    <Link
                      href="/auth"
                      className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 bg-gradient-to-r from-gold to-amber-500 text-white shadow-lg shadow-gold/15 hover:shadow-gold/30 hover:brightness-110"
                    >
                      <Flame className="w-3 h-3" />
                      Order Now
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-1.5">
              <Link href="/cart" className="relative p-1.5">
                <ShoppingCart className={cn(
                  'w-[18px] h-[18px] transition-colors',
                  isTransparent ? 'text-white/70' : 'text-zinc-300'
                )} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-[11px] font-black text-gold">
                    {itemCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-300',
                  isTransparent
                    ? 'text-white/70 hover:bg-white/8'
                    : 'text-zinc-400 hover:bg-white/5'
                )}
              >
                <motion.div
                  animate={{ rotate: mobileOpen ? 90 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll progress */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent origin-left"
          style={{ scaleX }}
        />
      </motion.nav>

      {/* Mobile Overlay — Full-screen left drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0A0A0F]/95 border-r border-white/8 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
                <Image
                  src="/logo.webp"
                  alt="Crave"
                  width={100}
                  height={30}
                  className="h-5 w-auto"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                        pathname === link.href
                          ? 'bg-gold/10 text-gold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Separator */}
                <div className="h-px bg-white/5 my-3" />

                {/* Cart */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-gold" />
                      Cart
                    </span>
                    {itemCount > 0 && (
                      <span className="px-2 py-0.5 bg-gold/15 text-gold text-[10px] font-black rounded-full">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </motion.div>

                {user && (
                  <>
                    {isAdmin && (
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 }}
                      >
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gold" />
                          Admin Panel
                        </Link>
                      </motion.div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.26 }}
                    >
                      <Link
                        href="/orders"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                      >
                        <Package className="w-4 h-4 text-gold" />
                        My Orders
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                      >
                        <User className="w-4 h-4 text-gold" />
                        Profile
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-4 border-t border-white/5 space-y-2">
                {user ? (
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/8 border border-red-500/12 text-red-400 hover:bg-red-500/15 rounded-xl transition-colors font-semibold text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-gold to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-gold/10 transition-all"
                  >
                    <Flame className="w-4 h-4" />
                    Sign In to Order
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Helper component
function NavIconBtn({
  href,
  title,
  isTransparent,
  badge,
  children,
}: {
  href: string;
  title: string;
  isTransparent: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        'relative p-1.5 rounded-lg transition-all duration-300',
        isTransparent
          ? 'text-white/50 hover:text-white hover:bg-white/10'
          : 'text-zinc-500 hover:text-gold hover:bg-gold/10'
      )}
    >
      <span className="relative inline-block">
        {children}
        {badge && badge > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2.5 text-[12px] font-black text-gold"
          >
            {badge}
          </motion.span>
        ) : null}
      </span>
    </Link>
  );
}
