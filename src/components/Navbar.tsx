'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';
  const isTransparent = isHome && !scrolled;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isTransparent
            ? 'bg-transparent'
            : 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.span
                className={cn(
                  'text-2xl md:text-3xl font-bold transition-colors duration-300',
                  isTransparent ? 'text-white' : 'text-orange-500'
                )}
                whileHover={{ scale: 1.05 }}
              >
                CRAVE
              </motion.span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors duration-200 relative group',
                      isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-orange-500',
                      pathname === link.href && (isTransparent ? 'text-white' : 'text-orange-500')
                    )}
                  >
                    {link.label}
                    <span className={cn(
                      'absolute -bottom-1 left-0 h-0.5 bg-orange-500 transition-all duration-300',
                      pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                    )} />
                  </Link>
                </motion.div>
              ))}

              <Link
                href="/cart"
                className={cn(
                  'relative p-2 rounded-full transition-colors duration-200',
                  isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className={cn(
                        'p-2 rounded-full transition-colors duration-200',
                        isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                      )}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className={cn(
                      'p-2 rounded-full transition-colors duration-200',
                      isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                    )}
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={signOut}
                    className={cn(
                      'p-2 rounded-full transition-colors duration-200',
                      isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-red-500 hover:bg-red-50'
                    )}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className={cn(
                    'px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200',
                    isTransparent
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  )}
                >
                  Order Now
                </Link>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                'md:hidden p-2 rounded-lg transition-colors',
                isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6 pt-20 flex flex-col gap-4">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium text-gray-700 hover:text-orange-500 transition-colors py-2 border-b border-gray-100"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-medium text-gray-700 hover:text-orange-500 transition-colors py-2 border-b border-gray-100 flex items-center gap-2"
                >
                  Cart
                  {itemCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{itemCount}</span>
                  )}
                </Link>
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="text-lg font-medium text-gray-700 hover:text-orange-500 transition-colors py-2 border-b border-gray-100"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-orange-500 transition-colors py-2 border-b border-gray-100"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="text-lg font-medium text-red-500 hover:text-red-600 transition-colors py-2 text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 bg-orange-500 text-white text-center py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Sign In
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
