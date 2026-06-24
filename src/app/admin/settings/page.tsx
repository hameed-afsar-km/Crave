'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Settings as SettingsIcon, ArrowLeft, Store, Clock, Bell, Shield,
  Save, ToggleLeft, ToggleRight, IndianRupee, AlertTriangle, X,
  CookingPot, Users, Phone, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loadSettings, saveSettings, StoreSettings } from '@/lib/store';
import { generateTimeSlots } from '@/lib/utils';

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState<StoreSettings>(loadSettings());
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setForm(loadSettings());
  }, []);

  const update = (key: keyof StoreSettings, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
    };
    setForm(defaults);
    saveSettings(defaults);
    setShowResetConfirm(false);
  };

  const slots = generateTimeSlots();
  const maxSlotsToShow = 8;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-gold/22 text-zinc-400 hover:text-gold transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <SettingsIcon className="w-5 h-5 text-gold" />
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Settings</h1>
              </div>
              <p className="text-zinc-500 text-sm">Manage store preferences and configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 relative z-10 space-y-6">
        {/* Store Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Store className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Store Status</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Store {form.storeOpen ? 'Open' : 'Closed'}</p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                  {form.storeOpen ? 'Customers can browse and order' : 'Menu and ordering hidden from customers'}
                </p>
              </div>
              <button
                onClick={() => update('storeOpen', !form.storeOpen)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${form.storeOpen ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${form.storeOpen ? 'left-7 bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Accept Online Orders</p>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                  {form.acceptingOrders ? 'Orders can be placed' : 'Customers see "temporarily unavailable" message'}
                </p>
              </div>
              <button
                onClick={() => update('acceptingOrders', !form.acceptingOrders)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${form.acceptingOrders ? 'bg-emerald-500/30' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${form.acceptingOrders ? 'left-7 bg-emerald-400' : 'left-0.5 bg-zinc-500'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Store Details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Store className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Store Details</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Store Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => update('storeName', e.target.value)}
                className="w-full max-w-md px-4 py-3 input-dark rounded-xl text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Opening Time</label>
                <input
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => update('openingTime', e.target.value)}
                  className="w-full max-w-[200px] px-4 py-3 input-dark rounded-xl text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Closing Time</label>
                <input
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => update('closingTime', e.target.value)}
                  className="w-full max-w-[200px] px-4 py-3 input-dark rounded-xl text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Slot Capacity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Calendar className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Slot Capacity Management</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Max Orders Per Slot</label>
                <input
                  type="number"
                  value={form.maxOrdersPerSlot}
                  onChange={(e) => update('maxOrdersPerSlot', Number(e.target.value))}
                  className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Slot Duration (minutes)</label>
                <input
                  type="number"
                  value={form.slotDurationMinutes}
                  onChange={(e) => update('slotDurationMinutes', Number(e.target.value))}
                  className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium"
                  min="5"
                  max="60"
                  step="5"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Avg Prep Time (minutes)</label>
                <input
                  type="number"
                  value={form.averagePrepTime}
                  onChange={(e) => update('averagePrepTime', Number(e.target.value))}
                  className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium"
                  min="1"
                  max="60"
                />
              </div>
            </div>

            {/* Slot visualization */}
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Slot Preview</p>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  {slots.slice(0, maxSlotsToShow).map((slot, i) => {
                    const booked = Math.floor(Math.random() * form.maxOrdersPerSlot);
                    const full = booked >= form.maxOrdersPerSlot;
                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border min-w-[90px] ${
                          full
                            ? 'bg-rose-500/10 border-rose-500/25'
                            : 'bg-black/30 border-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold text-zinc-300">{slot.label}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-black ${full ? 'text-rose-400' : 'text-gold'}`}>{booked}</span>
                          <span className="text-[10px] text-zinc-600 font-semibold">/ {form.maxOrdersPerSlot}</span>
                        </div>
                        <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${full ? 'bg-rose-500' : 'bg-gold/50'}`}
                            style={{ width: `${(booked / form.maxOrdersPerSlot) * 100}%` }}
                          />
                        </div>
                        {full && <span className="text-[8px] font-black text-rose-400 uppercase tracking-wider">Full</span>}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Clock className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Pickup & Timing</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Pickup Window (minutes)</label>
              <input
                type="number"
                value={form.pickupWindowMinutes}
                onChange={(e) => update('pickupWindowMinutes', Number(e.target.value))}
                className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium"
                min="5"
                max="60"
              />
              <p className="text-[10px] text-zinc-600 font-semibold mt-1">Customers must pick up within this window after ready time</p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Est. Wait Time (minutes)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type="number"
                  value={form.estimatedWaitTime}
                  onChange={(e) => update('estimatedWaitTime', Number(e.target.value))}
                  className="w-full pl-11 pr-4 py-3 input-dark rounded-xl text-sm font-medium"
                  min="1"
                  max="120"
                />
              </div>
              <p className="text-[10px] text-zinc-600 font-semibold mt-1">Displayed to customers during checkout</p>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Bell className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Notifications</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'New Order Alerts', desc: 'Alert when a new order comes in', key: 'notifyNewOrders' as const },
              { label: 'Ready for Pickup', desc: 'Alert when order is marked ready', key: 'notifyReady' as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm font-bold text-zinc-200">{item.label}</p>
                  <p className="text-xs text-zinc-600 font-semibold mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => update(item.key, !form[item.key])}
                  className={form[item.key] ? 'text-gold' : 'text-zinc-700'}
                >
                  {form[item.key] ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-rose-500/10 p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-500/10">
            <Shield className="w-5 h-5 text-rose-400/70" />
            <h2 className="text-sm font-black text-rose-400 uppercase tracking-wider">Danger Zone</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-200">Reset All Settings</p>
              <p className="text-xs text-zinc-600 font-semibold mt-0.5">Restore all settings to factory defaults</p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Reset
            </button>
          </div>
        </motion.div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${
              saved
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white shadow-gold/15 hover:shadow-gold/30'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Settings'}
          </motion.button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowResetConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[rgba(15,14,24,0.95)] backdrop-blur-2xl border border-white/[0.08] rounded-[28px] p-8 w-full max-w-md shadow-[0_0_60px_rgba(0,0,0,0.8)] z-10 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Reset All Settings?</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              This will restore all settings to defaults. Orders and menu data are not affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3.5 border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/6 text-zinc-300 font-bold uppercase tracking-widest text-[10px] rounded-full transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-full shadow-lg shadow-rose-500/20 transition-all"
              >
                Reset Settings
              </button>
            </div>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
