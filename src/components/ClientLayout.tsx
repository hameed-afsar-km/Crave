'use client';

import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { AddToCartPopupProvider } from '@/context/AddToCartPopupContext';
import AddToCartPopup from './AddToCartPopup';
import Navbar from './Navbar';
import Footer from './Footer';
import PWARegister from './PWARegister';
import { ADMIN_SLUG } from '@/lib/admin-slug';
import { subscribeOutlets } from '@/lib/firestore-service';
import { saveOutlets } from '@/lib/outlets';

const SplashScreen = dynamic(() => import('./SplashScreen'), { ssr: false });
const QueueWidget = dynamic(() => import('./QueueWidget'), { ssr: false });

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/auth');
  const isAdmin = pathname?.startsWith(`/${ADMIN_SLUG}`);

  const handleSplashFinish = () => {
    setSplashDone(true);
  };

  useEffect(() => {
    const unsub = subscribeOutlets((fetched) => {
      saveOutlets(fetched);
    });
    return unsub;
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <AddToCartPopupProvider>
          <PWARegister />
          {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
          {!isAuth && !isAdmin && <Navbar />}
          <main id="main-content" className="flex-1">{children}</main>
          {!isAuth && !isAdmin && <QueueWidget />}
          {!isAuth && !isAdmin && <Footer />}
          <AddToCartPopup />
        </AddToCartPopupProvider>
      </CartProvider>
    </AuthProvider>
  );
}
