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

const statusDot = {
  Open: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
  Paused: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
  Closed: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
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

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-700',
          isTransparent
            ? 'py-5 md:py-6'
            : 'py-3 md:py-3.5 bg-[#08080B]/70 backdrop-blur-2xl border-b border-white/5'
        )}
      >
        {/* Top edge glow */}
        <div className={cn(
          'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent transition-opacity duration-700',
          isTransparent ? 'opacity-20' : 'opacity-100'
        )} />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
          <div className="flex items-center justify-between h-[48px] md:h-[56px]">

            {/* Left: Nav Links (desktop) */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'relative px-3.5 py-1.5 text-sm font-semibold tracking-wide rounded-xl transition-all duration-300',
                        isTransparent
                          ? active ? 'text-white bg-white/8' : 'text-white/55 hover:text-white/90 hover:bg-white/5'
                          : active ? 'text-gold bg-gold/8' : 'text-zinc-400 hover:text-gold hover:bg-gold/5'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 350, damping: 20 }}>
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
            <div className="flex items-center gap-3">
              {/* Store status — pulsing dot */}
              <div
                className={cn('w-2 h-2 rounded-full', statusDot[storeLabel as keyof typeof statusDot])}
                title={`Store ${storeLabel}`}
              />

              {/* Icon group (desktop) */}
              <div className="hidden md:flex items-center gap-0.5">
                {isAdmin && (
                  <NavIconBtn href="/admin/dashboard" title="Admin Dashboard" isTransparent={isTransparent}>
                    <LayoutDashboard className="w-[17px] h-[17px]" />
                  </NavIconBtn>
                )}

                {user && (
                  <NavIconBtn href="/orders" title="My Orders" isTransparent={isTransparent}>
                    <Package className="w-[17px] h-[17px]" />
                  </NavIconBtn>
                )}

                <CartIconBtn href="/cart" isTransparent={isTransparent} badge={itemCount} />

                {user ? (
                  <>
                    <NavIconBtn href="/profile" title="Profile" isTransparent={isTransparent}>
                      <User className="w-[17px] h-[17px]" />
                    </NavIconBtn>

                    <div className="w-px h-4 bg-white/8 mx-1.5" />

                    <button
                      onClick={signOut}
                      title="Sign Out"
                      className={cn(
                        'p-1.5 rounded-xl transition-all duration-300',
                        isTransparent
                          ? 'text-white/40 hover:text-rose-400 hover:bg-rose-500/10'
                          : 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10'
                      )}
                    >
                      <LogOut className="w-[17px] h-[17px]" />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-gold to-amber-500 text-white shadow-lg',
                      isTransparent
                        ? 'shadow-gold/20 hover:shadow-gold/30 hover:brightness-110'
                        : 'shadow-gold/10 hover:shadow-gold/25 hover:brightness-110'
                    )}
                  >
                    <Flame className="w-3 h-3" />
                    Order
                  </Link>
                )}
              </div>

              {/* Mobile: Cart + Hamburger */}
              <div className="flex md:hidden items-center gap-1.5">
                <Link href="/cart" className="relative p-1.5">
                  <ShoppingCart className={cn('w-[19px] h-[19px]', isTransparent ? 'text-white/70' : 'text-zinc-300')} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[11px] font-black text-gold">{itemCount}</span>
                  )}
                </Link>

                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className={cn('p-1.5 rounded-xl transition-all', isTransparent ? 'text-white/70 hover:bg-white/8' : 'text-zinc-400 hover:bg-white/5')}
                >
                  <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.25 }}>
                    {mobileOpen ? <X className="w-[19px] h-[19px]" /> : <Menu className="w-[19px] h-[19px]" />}
                  </motion.div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll progress */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent origin-left"
          style={{ scaleX }}
        />
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobile} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[90vh] bg-[#0C0C14]/98 border-t border-white/8 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/10" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <Image src="/logo.webp" alt="Crave" width={100} height={28} className="h-5 w-auto" />
                <button onClick={closeMobile} className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-white/5">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMobile}
                        className={cn(
                          'flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
                          active
                            ? 'bg-gold/10 text-gold border border-gold/15'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                        )}
                      >
                        {link.label}
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="h-px bg-white/5 my-3" />

                {/* Cart */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  <Link
                    href="/cart"
                    onClick={closeMobile}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent font-semibold text-sm transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart className="w-[18px] h-[18px] text-gold" />
                      Cart
                    </span>
                    {itemCount > 0 && (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-gold to-amber-600 text-white text-[10px] font-black rounded-full">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </motion.div>

                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="space-y-1"
                  >
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={closeMobile}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent font-semibold text-sm transition-all"
                      >
                        <LayoutDashboard className="w-[18px] h-[18px] text-gold" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent font-semibold text-sm transition-all"
                    >
                      <Package className="w-[18px] h-[18px] text-gold" />
                      My Orders
                    </Link>
                    <Link
                      href="/profile"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent font-semibold text-sm transition-all"
                    >
                      <User className="w-[18px] h-[18px] text-gold" />
                      Profile
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-4 border-t border-white/5">
                {user ? (
                  <button
                    onClick={() => { signOut(); closeMobile(); }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-rose-500/8 border border-rose-500/15 text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all font-semibold text-sm"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-gold to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-gold/10 transition-all"
                  >
                    <Flame className="w-[18px] h-[18px]" />
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

// Helper: Nav icon button
function NavIconBtn({
  href,
  title,
  isTransparent,
  children,
}: {
  href: string;
  title: string;
  isTransparent: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        'relative p-1.5 rounded-xl transition-all duration-300',
        isTransparent
          ? 'text-white/50 hover:text-white hover:bg-white/10'
          : 'text-zinc-500 hover:text-gold hover:bg-gold/10'
      )}
    >
      {children}
    </Link>
  );
}

// Helper: Cart icon with badge
function CartIconBtn({
  href,
  isTransparent,
  badge,
}: {
  href: string;
  isTransparent: boolean;
  badge: number;
}) {
  return (
    <Link
      href={href}
      title="Cart"
      className={cn(
        'relative p-1.5 rounded-xl transition-all duration-300',
        isTransparent
          ? 'text-white/50 hover:text-white hover:bg-white/10'
          : 'text-zinc-500 hover:text-gold hover:bg-gold/10'
      )}
    >
      <ShoppingCart className="w-[17px] h-[17px]" />
      {badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-gradient-to-br from-gold to-amber-600 text-[9px] font-black text-white ring-2 ring-[#08080B]"
        >
          {badge}
        </motion.span>
      )}
    </Link>
  );
}
