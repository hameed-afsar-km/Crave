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

const statusConfig = {
  Open: { label: 'OPEN', dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]', text: 'text-emerald-400' },
  Paused: { label: 'PAUSED', dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]', text: 'text-amber-400' },
  Closed: { label: 'CLOSED', dot: 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.4)]', text: 'text-rose-400' },
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

  const status = statusConfig[storeLabel as keyof typeof statusConfig];

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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
          <div className="flex items-center justify-between h-[48px] md:h-[56px]">

            {/* Left: Nav Links (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
                    className="relative"
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'relative px-3 py-2 text-sm font-semibold tracking-wider transition-all duration-300',
                        isTransparent
                          ? 'text-white/50 hover:text-white'
                          : 'text-zinc-500 hover:text-gold'
                      )}
                    >
                      {link.label}
                    </Link>
                    {active && (
                      <motion.div
                        layoutId="navDot"
                        className={cn(
                          'absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                          isTransparent ? 'bg-white' : 'bg-gold'
                        )}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    )}
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
            <div className="flex items-center gap-2.5">
              {/* Store status chip */}
              <div className={cn(
                'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300',
                isTransparent
                  ? 'border-white/8 bg-white/[0.03]'
                  : 'border-white/5 bg-white/[0.02]'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                <span className={cn('text-[10px] font-bold tracking-[0.12em]', status.text)}>
                  {status.label}
                </span>
              </div>

              {/* Icon group */}
              <div className="flex items-center gap-0.5">
                {isAdmin && (
                  <NavIconBtn href="/admin/dashboard" title="Dashboard" isTransparent={isTransparent}>
                    <LayoutDashboard className="w-[16px] h-[16px]" />
                  </NavIconBtn>
                )}

                {user && (
                  <NavIconBtn href="/orders" title="My Orders" isTransparent={isTransparent}>
                    <Package className="w-[16px] h-[16px]" />
                  </NavIconBtn>
                )}

                <CartIconBtn href="/cart" isTransparent={isTransparent} badge={itemCount} />

                {user ? (
                  <>
                    <NavIconBtn href="/profile" title="Profile" isTransparent={isTransparent}>
                      <User className="w-[16px] h-[16px]" />
                    </NavIconBtn>

                    <div className="w-px h-3.5 bg-white/6 mx-1" />

                    <button
                      onClick={signOut}
                      title="Sign Out"
                      className={cn(
                        'p-1.5 rounded-lg transition-all duration-300',
                        isTransparent
                          ? 'text-white/30 hover:text-rose-400 hover:bg-rose-500/10'
                          : 'text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10'
                      )}
                    >
                      <LogOut className="w-[16px] h-[16px]" />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 bg-gradient-to-r from-gold to-amber-500 text-white',
                      isTransparent ? 'shadow-lg shadow-gold/15' : 'shadow-md shadow-gold/10'
                    )}
                  >
                    <Flame className="w-3 h-3" />
                    Order
                  </Link>
                )}
              </div>

              {/* Mobile hamburger */}
              <div className="flex md:hidden items-center">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    isTransparent ? 'text-white/60 hover:bg-white/8' : 'text-zinc-500 hover:bg-white/5'
                  )}
                >
                  <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.25 }}>
                    {mobileOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
                  </motion.div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll progress */}
        <motion.div
          className="absolute bottom-0 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent origin-left"
          style={{ scaleX }}
        />
      </motion.nav>

      {/* Mobile Drawer: Full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeMobile} />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute top-0 left-0 right-0 bg-[#0C0C14]/98 border-b border-white/8 rounded-b-2xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <Image src="/logo.webp" alt="Crave" width={100} height={28} className="h-5 w-auto" />
                <button onClick={closeMobile} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5">
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Links */}
              <div className="px-4 pb-4 space-y-0.5">
                {navLinks.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMobile}
                        className={cn(
                          'flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
                          active
                            ? 'text-gold bg-gold/8'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {link.label}
                        {active && <span className="w-1 h-1 rounded-full bg-gold" />}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="h-px bg-white/5 my-2" />

                {/* Cart */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <Link
                    href="/cart"
                    onClick={closeMobile}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
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

                {/* User links */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.16 }}
                    className="space-y-0.5"
                  >
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={closeMobile}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                      >
                        <LayoutDashboard className="w-[18px] h-[18px] text-gold" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                    >
                      <Package className="w-[18px] h-[18px] text-gold" />
                      My Orders
                    </Link>
                    <Link
                      href="/profile"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                    >
                      <User className="w-[18px] h-[18px] text-gold" />
                      Profile
                    </Link>
                  </motion.div>
                )}

                {/* Bottom CTA */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-3"
                >
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
                </motion.div>
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
        'relative p-1.5 rounded-lg transition-all duration-300',
        isTransparent
          ? 'text-white/40 hover:text-white hover:bg-white/10'
          : 'text-zinc-600 hover:text-gold hover:bg-gold/10'
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
        'relative p-1.5 rounded-lg transition-all duration-300',
        isTransparent
          ? 'text-white/40 hover:text-white hover:bg-white/10'
          : 'text-zinc-600 hover:text-gold hover:bg-gold/10'
      )}
    >
      <ShoppingCart className="w-[16px] h-[16px]" />
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
