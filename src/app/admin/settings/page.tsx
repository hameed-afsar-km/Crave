'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Settings as SettingsIcon, ArrowLeft, Store, Clock, Bell, Shield,
  Save, IndianRupee, AlertTriangle, X, Trash2,
  CookingPot, Users, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { loadSettings, saveSettings, StoreSettings } from '@/lib/store';
import { generateTimeSlots } from '@/lib/utils';
import { saveSettingsToFirestore, subscribeSettings, subscribeOrders } from '@/lib/firestore-service';
import { logAction } from '@/lib/audit';

export default function AdminSettings() {
  const { isAdmin, isMasterAdmin, user } = useAuth();
  const { outlets } = useAdminOutlet();
  const [form, setForm] = useState<StoreSettings>(loadSettings());
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  useEffect(() => {
    const unsub = subscribeSettings((firestoreSettings) => {
      setForm(firestoreSettings);
    });
    return unsub;
  }, []);

  const update = (key: keyof StoreSettings, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(form);
    saveSettingsToFirestore(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    logAction('settings.updated', 'settings', 'global', { storeName: form.storeName, storeOpen: form.storeOpen }, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const handleReset = () => {
    const defaults: StoreSettings = {
      storeName: 'Crave Express',
      storeOpen: true,
      acceptingOrders: true,
      openingTime: '10:00',
      closingTime: '22:00',
      estimatedWaitTime: 12,
      maxOrdersPerSlot: 10,
      slotDurationMinutes: 15,
      averagePrepTime: 10,
      notifyNewOrders: true,
      notifyReady: true,
      pickupWindowMinutes: 15,
      earnRate: 10,
      rewards: [],
    };
    setForm(defaults);
    saveSettings(defaults);
    saveSettingsToFirestore(defaults);
    setShowResetConfirm(false);
    logAction('settings.reset', 'settings', 'global', {}, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const handleClearData = () => {
    setShowClearDataConfirm(false);
    logAction('data.cleared', 'data', 'all', {}, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const [orders, setOrders] = useState<any[]>([]);
  const slots = generateTimeSlots();
  const maxSlotsToShow = 8;

  useEffect(() => {
    const unsub = subscribeOrders((firestoreOrders) => {
      setOrders(firestoreOrders);
    });
    return unsub;
  }, []);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Header */}
      <div className="bg-[#0D0D14] border-b border-zinc-800/60">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-zinc-400" />
                <h1 className="text-xl font-bold text-white">Settings</h1>
              </div>
              <p className="text-zinc-500 text-sm">Manage store preferences and configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-4xl mx-auto space-y-5">
        {/* Outlet Management — master admin only */}
        {isMasterAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-zinc-500" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Outlet Management</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{outlets.length} outlets configured</p>
                </div>
              </div>
              <Link href="/admin/outlets"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-all"
              >
                Manage
              </Link>
            </div>
          </motion.div>
        )}

        {/* Store Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
            <Store className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Store Status</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Store {form.storeOpen ? 'Open' : 'Closed'}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{form.storeOpen ? 'Customers can browse and order' : 'Menu hidden from customers'}</p>
              </div>
              <button onClick={() => update('storeOpen', !form.storeOpen)}
                className={`relative w-11 h-6 rounded-full transition-all ${form.storeOpen ? 'bg-zinc-600' : 'bg-zinc-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all ${form.storeOpen ? 'left-5.5 bg-white' : 'left-0.5 bg-white'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Accept Online Orders</p>
                <p className="text-xs text-zinc-500 mt-0.5">{form.acceptingOrders ? 'Orders can be placed' : 'Customers see unavailable message'}</p>
              </div>
              <button onClick={() => update('acceptingOrders', !form.acceptingOrders)}
                className={`relative w-11 h-6 rounded-full transition-all ${form.acceptingOrders ? 'bg-zinc-600' : 'bg-zinc-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all ${form.acceptingOrders ? 'left-5.5 bg-white' : 'left-0.5 bg-white'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Store Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
            <Store className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Store Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Store Name</label>
              <input type="text" value={form.storeName} onChange={(e) => update('storeName', e.target.value)}
                className="w-full max-w-md px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Opening Time</label>
                <input type="time" value={form.openingTime} onChange={(e) => update('openingTime', e.target.value)}
                  className="w-full max-w-[200px] px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Closing Time</label>
                <input type="time" value={form.closingTime} onChange={(e) => update('closingTime', e.target.value)}
                  className="w-full max-w-[200px] px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Slot Capacity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Slot Capacity Management</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Max Orders Per Slot</label>
                <input type="number" value={form.maxOrdersPerSlot} onChange={(e) => update('maxOrdersPerSlot', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" min="1" max="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Slot Duration (min)</label>
                <input type="number" value={form.slotDurationMinutes} onChange={(e) => update('slotDurationMinutes', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" min="5" max="60" step="5" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Avg Prep Time (min)</label>
                <input type="number" value={form.averagePrepTime} onChange={(e) => update('averagePrepTime', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" min="1" max="60" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">Slot Preview</p>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-2 min-w-max">
                  {slots.slice(0, maxSlotsToShow).map((slot, i) => {
                    const slotStart = slot.time;
                    const [sh, sm] = slotStart.split(':').map(Number);
                    const slotStartMin = sh * 60 + sm;
                    const slotEndMin = slotStartMin + form.slotDurationMinutes;
                    const booked = orders.filter((o: any) => {
                      const pt = o.pickupTime || '';
                      const [ph, pm] = pt.split(':').map(Number);
                      if (isNaN(ph) || isNaN(pm)) return false;
                      const orderMin = ph * 60 + pm;
                      return orderMin >= slotStartMin && orderMin < slotEndMin;
                    }).length;
                    const full = booked >= form.maxOrdersPerSlot;
                    return (
                      <div key={i} className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border min-w-[80px] ${full ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-800/30 border-zinc-800/60'}`}>
                        <span className="text-xs font-medium text-zinc-300">{slot.label}</span>
                        <div className="flex items-center gap-0.5">
                          <span className={`text-sm font-semibold ${full ? 'text-red-400' : 'text-white'}`}>{booked}</span>
                          <span className="text-[10px] text-zinc-500">/ {form.maxOrdersPerSlot}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-zinc-600'}`} style={{ width: `${(booked / form.maxOrdersPerSlot) * 100}%` }} />
                        </div>
                        {full && <span className="text-[9px] font-semibold text-red-400">Full</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pickup Window */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Pickup & Timing</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Pickup Window (minutes)</label>
              <input type="number" value={form.pickupWindowMinutes} onChange={(e) => update('pickupWindowMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" min="5" max="60" />
              <p className="text-xs text-zinc-600 mt-1">Customers must pick up within this window</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Est. Wait Time (minutes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <input type="number" value={form.estimatedWaitTime} onChange={(e) => update('estimatedWaitTime', Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" min="1" max="120" />
              </div>
              <p className="text-xs text-zinc-600 mt-1">Displayed during checkout</p>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-[#12121A] rounded-xl border border-zinc-800/60 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
            <Bell className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New Order Alerts', desc: 'Alert when a new order comes in', key: 'notifyNewOrders' as const },
              { label: 'Ready for Pickup', desc: 'Alert when order is marked ready', key: 'notifyReady' as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
                <button onClick={() => update(item.key, !form[item.key])}
                  className={`relative w-11 h-6 rounded-full transition-all ${form[item.key] ? 'bg-zinc-600' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all ${form[item.key] ? 'left-5.5 bg-white' : 'left-0.5 bg-white'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-[#12121A] rounded-xl border border-red-500/20 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/20">
            <Shield className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-red-500/20 mb-4">
            <div>
              <p className="text-sm font-medium text-white">Reset All Settings</p>
              <p className="text-xs text-zinc-500 mt-0.5">Restore all settings to factory defaults</p>
            </div>
            <button onClick={() => setShowResetConfirm(true)} className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all">
              Reset
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Clear All Data</p>
              <p className="text-xs text-zinc-500 mt-0.5">Remove all orders, menu items, and seeded data</p>
            </div>
            <button onClick={() => setShowClearDataConfirm(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </motion.div>

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-medium transition-all ${
              saved ? 'bg-emerald-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : 'Save Settings'}
          </motion.button>
        </div>
      </div>

      {/* Clear data confirmation modal */}
      {showClearDataConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowClearDataConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-md shadow-xl z-10 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Clear All Data?</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              This will permanently delete all orders, menu items, and seeded sample data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearDataConfirm(false)} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={handleClearData} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all">Clear Everything</button>
            </div>
            <button onClick={() => setShowClearDataConfirm(false)} className="absolute top-3 right-3 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-md shadow-xl z-10 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Reset All Settings?</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              This will restore all settings to defaults. Orders and menu data are not affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={handleReset} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all">Reset Settings</button>
            </div>
            <button onClick={() => setShowResetConfirm(false)} className="absolute top-3 right-3 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
