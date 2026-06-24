'use client';

import { ReactNode, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

const SplashScreen = dynamic(() => import('./SplashScreen'), { ssr: false });
const QueueWidget = dynamic(() => import('./QueueWidget'), { ssr: false });

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/auth');
  const isAdmin = pathname?.startsWith('/admin');

  const handleSplashFinish = () => {
    setSplashDone(true);
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
