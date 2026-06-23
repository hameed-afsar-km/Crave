'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard, Flame } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
];

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

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isTransparent
            ? 'py-5'
            : 'bg-black/55 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04),0_20px_40px_rgba(0,0,0,0.5)] py-3'
        )}
      >
        {/* Bottom accent line when scrolled */}
        <AnimatePresence>
          {!isTransparent && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/35 to-transparent origin-center"
            />
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px] md:h-[68px]">

            {/* Left: Nav Links */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'relative text-sm font-semibold tracking-wide transition-colors duration-300 py-1.5 group',
                        isTransparent
                          ? active ? 'text-white' : 'text-white/65 hover:text-white'
                          : active ? 'text-gold' : 'text-zinc-400 hover:text-gold'
                      )}
                    >
                      {link.label}
                      {/* Animated underline */}
                      <span className={cn(
                        'absolute -bottom-0.5 left-0 h-[2px] rounded-full transition-all duration-300',
                        'bg-gradient-to-r from-gold-light via-gold to-amber-600',
                        active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                      )} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Center: Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gold/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src="/Logo Transparent.png"
                  alt="Crave"
                  className="h-8 md:h-10 w-auto relative z-10 drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]"
                />
              </motion.div>
            </Link>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              {isAdmin && (
                <NavIconBtn href="/admin/dashboard" title="Admin Dashboard" isTransparent={isTransparent}>
                  <LayoutDashboard className="w-[18px] h-[18px]" />
                </NavIconBtn>
              )}

              <div className="mr-4">
                <NavIconBtn href="/cart" title="Cart" isTransparent={isTransparent} badge={itemCount}>
                  <ShoppingCart className="w-[18px] h-[18px]" />
                </NavIconBtn>
              </div>

              {user ? (
                <>
                  <NavIconBtn href="/profile" title="Profile" isTransparent={isTransparent}>
                    <User className="w-[18px] h-[18px]" />
                  </NavIconBtn>

                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className={cn(
                      'p-2.5 rounded-xl border border-transparent transition-all duration-300',
                      isTransparent ? 'text-white/65 hover:text-red-400 hover:bg-red-500/8' : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/8'
                    )}
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                  </button>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Link
                    href="/auth"
                    className={cn(
                      'relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 overflow-hidden',
                      isTransparent
                        ? 'bg-white text-zinc-900 hover:bg-white/95 shadow-lg hover:shadow-xl hover:scale-[1.03]'
                        : 'bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white shadow-lg shadow-gold/15 hover:shadow-gold/30 hover:scale-[1.03] animate-gradient'
                    )}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Order Now
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'md:hidden p-2.5 rounded-xl transition-all duration-300 border',
                isTransparent
                  ? 'text-white border-white/10 hover:bg-white/10'
                  : 'text-zinc-300 border-white/5 hover:bg-white/5 hover:border-white/10'
              )}
            >
              <motion.div
                animate={{ rotate: mobileOpen ? 90 : 0 }}
                transition={{ duration: 0.25 }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Scroll progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-light via-gold to-amber-600 origin-left"
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
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="absolute right-0 top-0 bottom-0 w-[300px] bg-[#08080F]/95 border-l border-white/8 shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/80">Navigation</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200',
                        pathname === link.href
                          ? 'bg-gold/10 text-gold border border-gold/15'
                          : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'
                      )}
                    >
                      {link.label}
                      {pathname === link.href && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                      )}
                    </Link>
                  </motion.div>
                ))}

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent font-semibold text-sm transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-gold" />
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
                  <>
                    {isAdmin && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }}>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-zinc-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all border border-transparent"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gold" />
                          Admin Panel
                        </Link>
                      </motion.div>
                    )}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-zinc-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all border border-transparent"
                      >
                        <User className="w-4 h-4 text-gold" />
                        Profile
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Drawer footer */}
              <div className="px-4 py-4 border-t border-white/5">
                {user ? (
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/8 border border-red-500/15 text-red-400 hover:bg-red-500/15 rounded-2xl transition-colors font-semibold text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-gold/10 transition-all"
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
        'relative p-2.5 rounded-xl border border-transparent transition-all duration-300',
        isTransparent
          ? 'text-white/70 hover:text-white hover:bg-white/8 hover:border-white/10'
          : 'text-zinc-400 hover:text-gold hover:bg-gold/5 hover:border-gold/12'
      )}
    >
      {children}
      {badge && badge > 0 ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber-600 text-[9px] font-black text-white ring-2 ring-black"
        >
          {badge}
        </motion.span>
      ) : null}
    </Link>
  );
}
