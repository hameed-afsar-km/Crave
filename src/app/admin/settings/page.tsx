'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Settings as SettingsIcon, ArrowLeft, Store, Bell, Shield,
  Save, AlertTriangle, X, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { loadSettings, saveSettings, StoreSettings } from '@/lib/store';
import { saveSettingsToFirestore, subscribeSettings } from '@/lib/firestore-service';
import { logAction } from '@/lib/audit';
import { adminPath } from '@/lib/admin-slug';

export default function AdminSettings() {
  const { canManageSettings, isMasterAdmin, user } = useAuth();
  const { outlets } = useAdminOutlet();
  const [form, setForm] = useState<StoreSettings>(loadSettings());
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);

  useEffect(() => {
    if (!canManageSettings) return;
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
      storeName: 'Crave',
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

  if (!canManageSettings) {
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
              <Link href={adminPath('dashboard')} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
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
              <Link href={adminPath('outlets')}
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
