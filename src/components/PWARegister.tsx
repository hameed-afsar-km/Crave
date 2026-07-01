'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/notification-service';

export default function PWARegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
