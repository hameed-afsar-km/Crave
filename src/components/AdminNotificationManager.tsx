'use client';

import { useEffect, useRef } from 'react';
import { useSoundAlert } from '@/hooks/useSoundAlert';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { subscribeOrders } from '@/lib/firestore-service';
import {
  isPushSupported,
  getNotificationPermission,
  requestPermission,
  registerServiceWorker,
  subscribeToPush,
  showBrowserNotification,
  isDocumentHidden,
} from '@/lib/notification-service';
import { loadSettings } from '@/lib/store';

export default function AdminNotificationManager() {
  const { isStaff } = useAuth();
  const { notify: playSound } = useSoundAlert();
  const lastOrderCountRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const reg = await registerServiceWorker();
      if (!reg) return;

      if (isPushSupported()) {
        const perm = getNotificationPermission();
        if (perm === 'granted') {
          await subscribeToPush(reg);
        } else if (perm === 'default') {
          const result = await requestPermission();
          if (result === 'granted') {
            await subscribeToPush(reg);
          }
        }
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    const settings = loadSettings();
    if (!settings.notifyNewOrders) return;

    console.log('[AdminNotificationManager] Subscribing to orders. Auth state:', {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isStaff,
    });

    const unsub = subscribeOrders((allOrders) => {
      const received = allOrders.filter((o) => o.status === 'received');
      const count = received.length;

      if (lastOrderCountRef.current > 0 && count > lastOrderCountRef.current) {
        const newOrdersCount = count - lastOrderCountRef.current;
        playSound();

        if (isDocumentHidden()) {
          showBrowserNotification(
            `${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} received`,
            {
              body: `You have ${count} order${count > 1 ? 's' : ''} waiting in the queue.`,
              tag: 'new-order',
              data: { url: '/admin/kitchen' },
            }
          );
        }
      }

      lastOrderCountRef.current = count;
    });

    return unsub;
  }, [isStaff, playSound]);

  return null;
}
