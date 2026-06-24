'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Settings, ArrowLeft, Store, Clock, Bell, Shield,
  Save, ToggleLeft, ToggleRight, IndianRupee
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeName, setStoreName] = useState('Crave Express');
  const [openingTime, setOpeningTime] = useState('10:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [waitTime, setWaitTime] = useState('12');
  const [maxOrders, setMaxOrders] = useState('50');
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyReady, setNotifyReady] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
                <Settings className="w-5 h-5 text-gold" />
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

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Store is currently <span className={storeOpen ? 'text-emerald-400' : 'text-rose-400'}>{storeOpen ? 'Open' : 'Closed'}</span></p>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                {storeOpen ? 'Customers can place orders normally' : 'Orders are paused. Menu is hidden from customers.'}
              </p>
            </div>
            <button
              onClick={() => setStoreOpen(!storeOpen)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                storeOpen ? 'bg-emerald-500/30' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${
                  storeOpen ? 'left-7 bg-emerald-400' : 'left-0.5 bg-zinc-500'
                }`}
              />
            </button>
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
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full max-w-md px-4 py-3 input-dark rounded-xl text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full max-w-[200px] px-4 py-3 input-dark rounded-xl text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full max-w-[200px] px-4 py-3 input-dark rounded-xl text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Est. Wait Time (minutes)</label>
                <div className="relative max-w-[200px]">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                  <input
                    type="number"
                    value={waitTime}
                    onChange={(e) => setWaitTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 input-dark rounded-xl text-sm font-medium"
                    min="1"
                    max="60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Max Orders Per Slot</label>
                <div className="relative max-w-[200px]">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                  <input
                    type="number"
                    value={maxOrders}
                    onChange={(e) => setMaxOrders(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 input-dark rounded-xl text-sm font-medium"
                    min="1"
                    max="200"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Bell className="w-5 h-5 text-gold/70" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Notifications</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'New Order Alerts', desc: 'Get notified when a new order comes in', state: notifyNewOrders, set: setNotifyNewOrders },
              { label: 'Ready for Pickup', desc: 'Sound alert when order is marked ready', state: notifyReady, set: setNotifyReady },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm font-bold text-zinc-200">{item.label}</p>
                  <p className="text-xs text-zinc-600 font-semibold mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.set(!item.state)}
                  className={item.state ? 'text-gold' : 'text-zinc-700'}
                >
                  {item.state ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
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
              <p className="text-sm font-bold text-zinc-200">Reset All Data</p>
              <p className="text-xs text-zinc-600 font-semibold mt-0.5">Permanently clear all orders and reset settings to defaults</p>
            </div>
            <button className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
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
    </div>
  );
}
