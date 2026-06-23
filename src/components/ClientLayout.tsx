'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import SplashScreen from './SplashScreen';
import QueueWidget from './QueueWidget';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/auth');
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('crave-splash');
    if (hasSeen) {
      setSplashDone(true);
    }
  }, []);

  const handleSplashFinish = () => {
    setSplashDone(true);
    sessionStorage.setItem('crave-splash', 'true');
  };

  return (
    <AuthProvider>
      <CartProvider>
        {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
        {!isAuth && !isAdmin && <Navbar />}
        <main className="flex-1">{children}</main>
        {!isAuth && !isAdmin && <QueueWidget />}
        {!isAuth && !isAdmin && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
}
