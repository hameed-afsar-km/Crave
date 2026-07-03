'use client';

import { useState, useEffect } from 'react';
import { Store, AlertTriangle } from 'lucide-react';
import { loadSettings, getTimeUntilOpen } from '@/lib/store';

export default function StoreStatusBanner() {
  const [status, setStatus] = useState({ isOpen: true, acceptingOrders: true, label: 'Open' });
  const [timer, setTimer] = useState('');

  useEffect(() => {
    const update = () => {
      const settings = loadSettings();
      setStatus({
        isOpen: settings.storeOpen,
        acceptingOrders: settings.acceptingOrders,
        label: settings.storeOpen ? (settings.acceptingOrders ? 'Open' : 'Paused') : 'Closed',
      });
      setTimer(getTimeUntilOpen());
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status.isOpen && status.acceptingOrders) return null;

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3.5 text-sm ${
      status.isOpen
        ? 'bg-amber-500/8 border-amber-500/15'
        : 'bg-rose-500/8 border-rose-500/15'
    }`}>
      {status.isOpen ? (
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      ) : (
        <Store className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`font-black text-sm ${status.isOpen ? 'text-amber-400' : 'text-rose-400'}`}>
          Store {status.isOpen ? 'Paused' : 'Closed'}
        </p>
        <p className="text-zinc-400 text-xs font-semibold mt-0.5">
          {timer}
        </p>
      </div>
    </div>
  );
}
